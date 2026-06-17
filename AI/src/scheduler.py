"""Constraint Programming scheduler using OR-Tools CP-SAT (Final CP notebook)."""

from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from ortools.sat.python import cp_model

from .utils import minutes_to_time_str, time_to_minutes


class SolutionCollector(cp_model.CpSolverSolutionCallback):
    """Collect solutions during CP-SAT search."""

    def __init__(
        self,
        assignment_vars: Dict,
        divisions: List[Dict],
        days: List[str],
        rooms: List[str],
        time_slots: List[int],
        courses_df: pd.DataFrame,
    ) -> None:
        cp_model.CpSolverSolutionCallback.__init__(self)
        self.assignment_vars = assignment_vars
        self.divisions = divisions
        self.days = days
        self.rooms = rooms
        self.time_slots = time_slots
        self.courses_df = courses_df
        self.solutions: List[List[Dict[str, Any]]] = []

    def on_solution_callback(self) -> None:
        solution: List[Dict[str, Any]] = []

        for pair_idx, assignments in self.assignment_vars.items():
            pair_info = self.divisions[pair_idx]
            course_id = pair_info["course_id"]

            for assignment in assignments.values():
                day = self.days[self.Value(assignment["day"])]
                room = self.rooms[self.Value(assignment["room"])]
                start_time = self.time_slots[self.Value(assignment["time"])]

                course_info = self.courses_df[
                    self.courses_df["Course_ID"] == course_id
                ].iloc[0]
                hours_per_day = int(course_info["Hours_per_day"])
                end_time = start_time + (hours_per_day * 60)

                solution.append(
                    {
                        "Day": day,
                        "Course_ID": course_id,
                        "Instructor_ID": course_info["Instructor_ID"],
                        "Group_ID": pair_info["div_id"],
                        "Room_ID": room,
                        "Time_Slot": f"{day}_{start_time}_{end_time}",
                        "Start_Time": start_time,
                        "End_Time": end_time,
                        "Duration": hours_per_day * 60,
                    }
                )

        self.solutions.append(solution)

    def get_best_solution(self) -> Optional[List[Dict[str, Any]]]:
        if self.solutions:
            return self.solutions[-1]
        return None


class SchedulingCP:
    """Constraint Programming scheduler using OR-Tools CP-SAT."""

    STATUS_NAMES = {
        cp_model.OPTIMAL: "OPTIMAL",
        cp_model.FEASIBLE: "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.UNKNOWN: "UNKNOWN",
    }

    def __init__(
        self,
        courses_df: pd.DataFrame,
        rooms_df: pd.DataFrame,
        doctors_df: pd.DataFrame,
        divisions_df: pd.DataFrame,
        time_limit_seconds: int = 300,
        use_optimization: bool = True,
        max_days_per_year: int = 3,
        relax_if_infeasible: bool = True,
    ) -> None:
        self.courses_df = courses_df.copy()
        self.rooms_df = rooms_df.copy()
        self.doctors_df = doctors_df.copy()
        self.divisions_df = divisions_df.copy()
        self.time_limit_seconds = time_limit_seconds
        self.use_optimization = use_optimization
        self.max_days_per_year = int(max_days_per_year)
        self.initial_max_days_per_year = int(max_days_per_year)
        self.relax_if_infeasible = bool(relax_if_infeasible)
        self.last_solver_status: Optional[str] = None

        self.courses: List[str] = []
        self.divisions: List[Dict[str, Any]] = []
        self.days: List[str] = []
        self.all_rooms: List[str] = []
        self.lecture_rooms: List[str] = []
        self.lab_rooms: List[str] = []
        self.room_capacity: Dict[str, int] = {}
        self.time_slots: List[int] = []
        self.doctor_availability: Dict[str, Dict[str, List[tuple]]] = {}

        self.assignment_vars: Dict = {}
        self.year_day_active: Dict = {}

        self.prepare_data()

    def prepare_data(self) -> None:
        """Prepare data structures for CP solver."""
        self.courses = self.courses_df["Course_ID"].tolist()

        self.doctor_availability = {}
        for _, row in self.doctors_df.iterrows():
            inst_id = row["Instructor_ID"]
            day = row["Day"]
            start_minutes = time_to_minutes(row["Start_Time"])
            end_minutes = time_to_minutes(row["End_Time"])

            if inst_id not in self.doctor_availability:
                self.doctor_availability[inst_id] = {}
            if day not in self.doctor_availability[inst_id]:
                self.doctor_availability[inst_id][day] = []
            self.doctor_availability[inst_id][day].append((start_minutes, end_minutes))

        self.divisions = []
        for _, course_row in self.courses_df.iterrows():
            course_id = course_row["Course_ID"]
            year = course_row["Year"]
            major = course_row["Major"]
            dept = course_row["Department"]

            matching_divs = self.divisions_df[
                (self.divisions_df["Year"] == year)
                & (self.divisions_df["Major"] == major)
                & (self.divisions_df["Department"] == dept)
            ]

            if matching_divs.empty:
                fallback_divs = self.divisions_df[
                    (self.divisions_df["Year"] == year)
                    & (self.divisions_df["Department"] == dept)
                ]
                if fallback_divs.empty:
                    print(
                        f"Warning: No matching division for course {course_id} "
                        f"(Year={year}, Major={major}, Dept={dept})"
                    )
                    continue
                matching_divs = fallback_divs

            best_div = matching_divs.sort_values("StudentNum", ascending=False).iloc[0]
            self.divisions.append(
                {
                    "course_id": course_id,
                    "div_id": best_div["Num_ID"],
                    "group_idx": 0,
                    "group_key": str(best_div["Num_ID"]),
                    "required_days": int(course_row["Days"]),
                    "year": int(year),
                }
            )

        if len(self.doctors_df) > 0 and "Day" in self.doctors_df.columns:
            self.days = self.doctors_df["Day"].unique().tolist()
        else:
            self.days = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Saturday",
            ]

        self.all_rooms = self.rooms_df["Room_ID"].tolist()
        self.lecture_rooms = self.rooms_df[
            self.rooms_df["Type"] == "Lecture"
        ]["Room_ID"].tolist()
        self.lab_rooms = self.rooms_df[self.rooms_df["Type"] == "Lab"]["Room_ID"].tolist()

        self.room_capacity = {
            row["Room_ID"]: int(row["Capacity"]) for _, row in self.rooms_df.iterrows()
        }
        self.time_slots = list(range(8 * 60, 17 * 60 + 1, 60))

    def build_model(self) -> cp_model.CpModel:
        """Build the CP-SAT model with all constraints."""
        model = cp_model.CpModel()
        self.assignment_vars = {}

        for pair_idx, pair_info in enumerate(self.divisions):
            days_needed = int(pair_info["required_days"])
            self.assignment_vars[pair_idx] = {}

            for day_idx in range(days_needed):
                day_var = model.NewIntVar(0, len(self.days) - 1, f"day_{pair_idx}_{day_idx}")
                room_var = model.NewIntVar(0, len(self.all_rooms) - 1, f"room_{pair_idx}_{day_idx}")
                time_var = model.NewIntVar(0, len(self.time_slots) - 1, f"time_{pair_idx}_{day_idx}")

                self.assignment_vars[pair_idx][day_idx] = {
                    "day": day_var,
                    "room": room_var,
                    "time": time_var,
                    "course_id": pair_info["course_id"],
                    "div_id": pair_info["div_id"],
                    "group_idx": pair_info["group_idx"],
                    "year": pair_info["year"],
                }

        self._add_constraints(model)
        return model

    def _add_constraints(self, model: cp_model.CpModel) -> None:
        """Add all constraints to the model."""
        day_indices = {day: i for i, day in enumerate(self.days)}
        room_indices = {room: i for i, room in enumerate(self.all_rooms)}

        for pair_idx, assignments in self.assignment_vars.items():
            pair_info = self.divisions[pair_idx]
            course_id = pair_info["course_id"]
            div_id = pair_info["div_id"]
            course_info = self.courses_df[self.courses_df["Course_ID"] == course_id].iloc[0]
            div_info = self.divisions_df[self.divisions_df["Num_ID"] == div_id].iloc[0]

            instructor_id = course_info["Instructor_ID"]
            course_type = course_info["Type"]
            hours_per_day = int(course_info["Hours_per_day"])
            duration_minutes = hours_per_day * 60
            students_requiring_room = int(div_info["StudentNum"]) // 2

            candidate_rooms = (
                self.lecture_rooms if course_type == "Lecture" else self.lab_rooms
            )
            suitable_rooms = [
                room_indices[r]
                for r in candidate_rooms
                if self.room_capacity.get(r, 0) >= students_requiring_room
            ]

            if not suitable_rooms:
                sorted_by_capacity = sorted(
                    candidate_rooms,
                    key=lambda r: self.room_capacity.get(r, 0),
                    reverse=True,
                )
                if sorted_by_capacity:
                    largest_cap = self.room_capacity.get(sorted_by_capacity[0], 0)
                    suitable_rooms = [
                        room_indices[r]
                        for r in sorted_by_capacity
                        if self.room_capacity.get(r, 0) == largest_cap
                    ]
                    print(
                        f"Warning: No room fits {students_requiring_room} students for "
                        f"{course_id}/{div_id}. Using largest capacity {largest_cap}."
                    )

            available_day_indices = []
            if instructor_id in self.doctor_availability:
                for day in self.doctor_availability[instructor_id]:
                    if day in day_indices:
                        available_day_indices.append(day_indices[day])

            if not available_day_indices or len(available_day_indices) < int(
                pair_info["required_days"]
            ):
                available_day_indices = list(range(len(self.days)))

            for assignment in assignments.values():
                model.AddAllowedAssignments(
                    [assignment["room"]], [(room_idx,) for room_idx in suitable_rooms]
                )
                model.AddAllowedAssignments(
                    [assignment["day"]], [(day_idx,) for day_idx in available_day_indices]
                )

                for time_idx, start_time in enumerate(self.time_slots):
                    end_time = start_time + duration_minutes
                    if end_time > 17 * 60:
                        model.Add(assignment["time"] != time_idx)

        for pair_idx1, assignments1 in self.assignment_vars.items():
            pair_info1 = self.divisions[pair_idx1]
            course_info1 = self.courses_df[
                self.courses_df["Course_ID"] == pair_info1["course_id"]
            ].iloc[0]
            instructor_id1 = course_info1["Instructor_ID"]
            group_key1 = pair_info1["group_key"]

            for day_idx1, assignment1 in assignments1.items():
                for pair_idx2, assignments2 in self.assignment_vars.items():
                    if pair_idx1 >= pair_idx2:
                        continue

                    pair_info2 = self.divisions[pair_idx2]
                    course_info2 = self.courses_df[
                        self.courses_df["Course_ID"] == pair_info2["course_id"]
                    ].iloc[0]
                    instructor_id2 = course_info2["Instructor_ID"]
                    group_key2 = pair_info2["group_key"]

                    for day_idx2, assignment2 in assignments2.items():
                        room_conflict = model.NewBoolVar(
                            f"room_conflict_{pair_idx1}_{day_idx1}_{pair_idx2}_{day_idx2}"
                        )
                        model.Add(assignment1["room"] == assignment2["room"]).OnlyEnforceIf(
                            room_conflict
                        )
                        model.Add(assignment1["room"] != assignment2["room"]).OnlyEnforceIf(
                            room_conflict.Not()
                        )

                        same_day = model.NewBoolVar(
                            f"same_day_{pair_idx1}_{day_idx1}_{pair_idx2}_{day_idx2}"
                        )
                        model.Add(assignment1["day"] == assignment2["day"]).OnlyEnforceIf(
                            same_day
                        )
                        model.Add(assignment1["day"] != assignment2["day"]).OnlyEnforceIf(
                            same_day.Not()
                        )

                        both_room_day = model.NewBoolVar(
                            f"both_rd_{pair_idx1}_{day_idx1}_{pair_idx2}_{day_idx2}"
                        )
                        model.AddBoolAnd([room_conflict, same_day]).OnlyEnforceIf(both_room_day)
                        model.AddBoolOr([room_conflict.Not(), same_day.Not()]).OnlyEnforceIf(
                            both_room_day.Not()
                        )
                        model.Add(assignment1["time"] != assignment2["time"]).OnlyEnforceIf(
                            both_room_day
                        )

                        if instructor_id1 == instructor_id2:
                            model.Add(assignment1["time"] != assignment2["time"]).OnlyEnforceIf(
                                same_day
                            )

                        if group_key1 == group_key2:
                            model.Add(assignment1["time"] != assignment2["time"]).OnlyEnforceIf(
                                same_day
                            )

        years = sorted({pair_info["year"] for pair_info in self.divisions})
        self.year_day_active = {}

        for year in years:
            active_vars = []
            for day_idx in range(len(self.days)):
                yday = model.NewBoolVar(f"year_{year}_day_{day_idx}_active")
                self.year_day_active[(year, day_idx)] = yday
                active_vars.append(yday)
            model.Add(sum(active_vars) <= self.max_days_per_year)

        for pair_idx, assignments in self.assignment_vars.items():
            year = self.divisions[pair_idx]["year"]
            for assignment in assignments.values():
                for day_idx in range(len(self.days)):
                    day_is_idx = model.NewBoolVar(f"pair_{pair_idx}_is_day_{day_idx}")
                    model.Add(assignment["day"] == day_idx).OnlyEnforceIf(day_is_idx)
                    model.Add(assignment["day"] != day_idx).OnlyEnforceIf(day_is_idx.Not())
                    model.AddImplication(day_is_idx, self.year_day_active[(year, day_idx)])

        for assignments in self.assignment_vars.values():
            if len(assignments) > 1:
                day_vars = [assignment["day"] for assignment in assignments.values()]
                model.AddAllDifferent(day_vars)

    def solve(self) -> Optional[List[Dict[str, Any]]]:
        """Solve the constraint programming problem."""
        limits_to_try = [self.max_days_per_year]
        if self.relax_if_infeasible:
            for limit in range(self.max_days_per_year + 1, len(self.days) + 1):
                limits_to_try.append(limit)

        for limit in limits_to_try:
            self.max_days_per_year = limit
            model = self.build_model()

            solver = cp_model.CpSolver()
            solver.parameters.max_time_in_seconds = self.time_limit_seconds

            collector = SolutionCollector(
                self.assignment_vars,
                self.divisions,
                self.days,
                self.all_rooms,
                self.time_slots,
                self.courses_df,
            )

            status = solver.Solve(model, collector)
            self.last_solver_status = self.STATUS_NAMES.get(status, str(status))

            if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
                return collector.get_best_solution()

            if status != cp_model.INFEASIBLE:
                return None

        return None

    def format_schedule(
        self, schedule: List[Dict[str, Any]]
    ) -> tuple[List[Dict[str, Any]], pd.DataFrame]:
        """Format raw CP solution into API rows and a DataFrame."""
        formatted: List[Dict[str, Any]] = []
        rows: List[Dict[str, Any]] = []

        for assignment in schedule:
            course_id = assignment["Course_ID"]
            instructor_id = assignment["Instructor_ID"]
            division_id = str(assignment["Group_ID"])
            room_id = assignment["Room_ID"]
            day = assignment["Day"]

            course_info = self.courses_df[self.courses_df["Course_ID"] == course_id].iloc[0]
            instructor_match = self.doctors_df[
                self.doctors_df["Instructor_ID"] == instructor_id
            ]
            instructor_name = (
                instructor_match.iloc[0]["Instructor_Name"]
                if not instructor_match.empty
                else f"Unknown ({instructor_id})"
            )
            division_info = self.divisions_df[
                self.divisions_df["Num_ID"] == division_id
            ].iloc[0]
            room_info = self.rooms_df[self.rooms_df["Room_ID"] == room_id].iloc[0]

            start_time_str = minutes_to_time_str(int(assignment.get("Start_Time", 0)))
            end_time_str = minutes_to_time_str(int(assignment.get("End_Time", 0)))
            students = int(division_info["StudentNum"]) // 2

            row = {
                "Day": day,
                "Course_Name": course_info["Course_Name"],
                "Instructor_Name": instructor_name,
                "Students": students,
                "Room": room_info["Room"],
                "Start_Time": start_time_str,
                "End_Time": end_time_str,
                "Department": course_info["Department"],
                "Major": course_info["Major"],
            }
            rows.append(row)

            formatted.append(
                {
                    "day": day,
                    "course_name": course_info["Course_Name"],
                    "instructor_name": instructor_name,
                    "students": students,
                    "room": room_info["Room"],
                    "start_time": start_time_str,
                    "end_time": end_time_str,
                    "department": course_info["Department"],
                    "major": course_info["Major"],
                    "year": int(course_info["Year"]),
                }
            )

        return formatted, pd.DataFrame(rows)

    def save_schedule(self, schedule_df: pd.DataFrame, output_path: Path) -> Path:
        """Save CP schedule to Excel."""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        written_path = output_path

        try:
            schedule_df.to_excel(written_path, sheet_name="Schedule", index=False)
        except PermissionError:
            fallback_path = output_path.with_name(
                f"{output_path.stem}_{pd.Timestamp.now():%Y%m%d_%H%M%S}{output_path.suffix}"
            )
            schedule_df.to_excel(fallback_path, sheet_name="Schedule", index=False)
            written_path = fallback_path

        return written_path
