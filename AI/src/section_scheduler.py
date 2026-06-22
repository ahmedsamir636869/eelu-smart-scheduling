"""Section scheduler — refactored from Final S Cp.ipynb."""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from .section_utils import find_column


FINAL_COLS = [
    "Day",
    "Course_Name",
    "Instructor_Name",
    "Assistant_Name",
    "Students",
    "Room",
    "Start_Time",
    "End_Time",
    "Major",
]


@dataclass
class SectionScheduleResult:
    """Result of section scheduling."""

    combined_schedule: pd.DataFrame
    cp_formatted: pd.DataFrame
    section_schedule: pd.DataFrame
    written_path: Optional[Path] = None

    @property
    def unassigned_sections(self) -> int:
        if self.section_schedule.empty or "Day" not in self.section_schedule.columns:
            return 0
        return int((self.section_schedule["Day"] == "UNASSIGNED").sum())


class SectionScheduler:
    """Assign lab sections to CP time slots without conflicts."""

    def __init__(
        self,
        cp_schedule: pd.DataFrame,
        rooms: pd.DataFrame,
        sections: pd.DataFrame,
        assistants: pd.DataFrame,
        divisions: pd.DataFrame,
        courses: pd.DataFrame,
        doctors: pd.DataFrame,
    ) -> None:
        self.cp_schedule = cp_schedule.copy()
        self.rooms = rooms.copy()
        self.sections = sections.copy()
        self.assistants = assistants.copy()
        self.divisions = divisions.copy()
        self.courses = courses.copy()
        self.doctors = doctors.copy()

    def run(self, output_path: Optional[Path] = None) -> SectionScheduleResult:
        """Build combined CP + section schedule."""
        cp_slots = self._prepare_cp_slots()
        assistant_pool, assistant_id_to_name = self._build_assistant_pool()
        division_students = self._build_division_students()
        course_instructor_from_data = self._build_course_instructor_map()
        course_defaults = self._build_course_defaults(cp_slots)

        sec_course_col = find_column(self.sections, ["Course_Name", "Course", "Subject"], required=False)
        sec_div_col = find_column(self.sections, ["Division", "Num_ID", "Division_ID", "Group_ID", "Group", "Major"], required=False)
        sec_name_col = find_column(self.sections, ["Section", "Section_Name", "Sec", "Name"], required=False)
        sec_inst_col = find_column(self.sections, ["Instructor_Name", "Instructor", "Doctor", "Assistant", "Assistant_Name", "TA"], required=False)

        def normalize_instructor_name(value: Any) -> str:
            raw = "" if value is None else str(value).strip()
            return assistant_id_to_name.get(raw, raw)

        from .utils import time_to_minutes, minutes_to_time_str
        
        # Determine available days from CP slots, or default
        days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
        if "Day" in cp_slots.columns and not cp_slots["Day"].empty:
            days = cp_slots["Day"].unique().tolist()
        
        # Standard time blocks (2 hours)
        blocks = [
            (9 * 60, 11 * 60),
            (11 * 60, 13 * 60),
            (13 * 60, 15 * 60),
            (15 * 60, 17 * 60),
        ]
        
        # Initialize busy tracking from CP lectures
        room_busy: List[Tuple[str, int, int, str]] = []  # day, start, end, room
        div_busy: List[Tuple[str, int, int, str]] = []   # day, start, end, division
        inst_busy: List[Tuple[str, int, int, str]] = []  # day, start, end, instructor

        for _, row in cp_slots.iterrows():
            day = str(row.get("Day", "")).strip()
            room = str(row.get("Room", "")).strip()
            major = str(row.get("Major", "")).strip()
            inst = str(row.get("Instructor_Name", "")).strip()
            
            try:
                start_m = time_to_minutes(str(row.get("Start_Time", "")))
                end_m = time_to_minutes(str(row.get("End_Time", "")))
            except (ValueError, TypeError):
                continue
                
            if day and start_m < end_m:
                if room:
                    room_busy.append((day, start_m, end_m, room))
                if major:
                    div_busy.append((day, start_m, end_m, major))
                if inst:
                    inst_busy.append((day, start_m, end_m, inst))

        def is_overlap(start1, end1, start2, end2):
            return max(start1, start2) < min(end1, end2)

        import math
        
        section_rows: List[Dict[str, Any]] = []
        auto_instructor_idx = 0

        # Count sections per division+course to divide students
        section_counts = {}
        for _, sec in self.sections.iterrows():
            c_name = str(sec[sec_course_col]).strip() if sec_course_col else ""
            d_name = str(sec[sec_div_col]).strip() if sec_div_col else ""
            key = (c_name, d_name)
            section_counts[key] = section_counts.get(key, 0) + 1

        course_section_idx = {}

        # Pre-calculate room capacities and types
        room_capacities = {}
        room_types = {}
        room_name_col = find_column(self.rooms, ["Room", "Room_Name"])
        room_cap_col = find_column(self.rooms, ["Capacity", "Cap", "Size"], required=False)
        room_type_col = find_column(self.rooms, ["Type", "Room_Type"], required=False)
        for _, r in self.rooms.iterrows():
            rname = str(r.get(room_name_col, "")).strip()
            if rname:
                try:
                    room_capacities[rname] = int(r.get(room_cap_col, 30) if room_cap_col else 30)
                except (ValueError, TypeError):
                    room_capacities[rname] = 30
                if room_type_col is not None:
                    room_types[rname] = str(r.get(room_type_col, "")).strip().lower()
                else:
                    room_types[rname] = "lab"
                    
        all_rooms_list = list(room_capacities.keys())

        for i, sec in self.sections.iterrows():
            course_name = str(sec[sec_course_col]).strip() if sec_course_col else ""
            division_name = str(sec[sec_div_col]).strip() if sec_div_col else ""
            section_name = str(sec[sec_name_col]).strip() if sec_name_col else f"Section_{i + 1}"

            key = (course_name, division_name)
            course_section_idx[key] = course_section_idx.get(key, 0) + 1
            student_group_id = f"{division_name}_G{course_section_idx[key]}"

            if sec_inst_col and pd.notna(sec[sec_inst_col]) and str(sec[sec_inst_col]).strip():
                section_assistant = normalize_instructor_name(sec[sec_inst_col])
            else:
                section_assistant = normalize_instructor_name(assistant_pool[auto_instructor_idx % len(assistant_pool)])
                auto_instructor_idx += 1

            defaults = course_defaults.get(course_name, {})
            section_instructor_name = course_instructor_from_data.get(course_name) or defaults.get("Instructor_Name", "")
            
            raw_students = division_students.get(division_name, "")
            divided_students = raw_students
            try:
                num_secs = section_counts.get(key, 1)
                divided_students = str(math.ceil(int(raw_students) / num_secs))
            except (ValueError, TypeError):
                pass

            major = division_name if division_name else defaults.get("Major", "")

            assigned = False
            
            # Find an available slot
            for day in days:
                for start_m, end_m in blocks:
                    # Check division overlap (lectures block the whole division, sections block only the specific sub-group)
                    div_conflict = any(
                        db_day == day and (db_div == division_name or db_div == student_group_id) and is_overlap(start_m, end_m, db_start, db_end)
                        for db_day, db_start, db_end, db_div in div_busy
                    )
                    if div_conflict:
                        continue
                        
                    # Check assistant overlap
                    inst_conflict = any(
                        ib_day == day and ib_inst == section_assistant and is_overlap(start_m, end_m, ib_start, ib_end)
                        for ib_day, ib_start, ib_end, ib_inst in inst_busy
                    )
                    if inst_conflict:
                        continue
                        
                    # Find a free room
                    chosen_room = ""
                    
                    if "lab" in major.lower() or "practical" in major.lower() or "lab" in course_name.lower():
                        needed_type = "lab"
                    else:
                        needed_type = "lecture"
                        
                    # Filter rooms by type
                    target_rooms = [
                        r for r in all_rooms_list
                        if (needed_type == "lab" and "lab" in room_types.get(r, "lab")) or
                           (needed_type == "lecture" and "lecture" in room_types.get(r, "lecture"))
                    ]
                    # Fallback to all rooms if no specific ones match
                    if not target_rooms:
                        target_rooms = all_rooms_list

                    for room in target_rooms:
                        # Capacity check
                        cap = room_capacities.get(room, 30)
                        try:
                            if int(divided_students) > cap:
                                continue
                        except (ValueError, TypeError):
                            pass

                        room_conflict = any(
                            rb_day == day and rb_room == room and is_overlap(start_m, end_m, rb_start, rb_end)
                            for rb_day, rb_start, rb_end, rb_room in room_busy
                        )
                        if not room_conflict:
                            chosen_room = room
                            break
                            
                    if chosen_room:
                        room_busy.append((day, start_m, end_m, chosen_room))
                        div_busy.append((day, start_m, end_m, student_group_id))
                        inst_busy.append((day, start_m, end_m, section_assistant))
                        
                        section_rows.append({
                            "Day": day,
                            "Course_Name": course_name,
                            "Instructor_Name": section_instructor_name,
                            "Assistant_Name": section_assistant,
                            "Students": divided_students,
                            "Room": chosen_room,
                            "Start_Time": minutes_to_time_str(start_m),
                            "End_Time": minutes_to_time_str(end_m),
                            "Major": major,
                        })
                        assigned = True
                        break
                        
                if assigned:
                    break

            if not assigned:
                section_rows.append({
                    "Day": "UNASSIGNED",
                    "Course_Name": course_name,
                    "Instructor_Name": section_instructor_name,
                    "Assistant_Name": section_assistant,
                    "Students": divided_students,
                    "Room": "",
                    "Start_Time": "",
                    "End_Time": "",
                    "Major": major,
                })

        section_schedule = pd.DataFrame(section_rows)
        cp_formatted = self._format_cp_output(self.cp_schedule)
        combined_schedule = pd.concat([cp_formatted, section_schedule[FINAL_COLS]], ignore_index=True)

        written_path: Optional[Path] = None
        if output_path is not None:
            written_path = self._write_output_excel(
                output_path, combined_schedule, cp_formatted, section_schedule
            )

        return SectionScheduleResult(
            combined_schedule=combined_schedule,
            cp_formatted=cp_formatted,
            section_schedule=section_schedule,
            written_path=written_path,
        )

    def _prepare_cp_slots(self) -> pd.DataFrame:
        cp_slots = self.cp_schedule.copy()
        for col in ["Course_Name", "Day", "Start_Time", "End_Time"]:
            if col not in cp_slots.columns:
                raise ValueError(f"CP output missing column: {col}")

        for col in ["Assistant_Name", "Major", "Instructor_Name", "Students", "Room"]:
            if col not in cp_slots.columns:
                cp_slots[col] = ""

        return cp_slots

    def _get_lab_rooms(self) -> List[str]:
        room_name_col = find_column(self.rooms, ["Room", "Room_Name"])
        room_type_col = find_column(self.rooms, ["Type", "Room_Type"], required=False)

        if room_type_col is not None:
            lab_rooms = (
                self.rooms[
                    self.rooms[room_type_col]
                    .astype(str)
                    .str.lower()
                    .str.contains("lab", na=False)
                ][room_name_col]
                .astype(str)
                .tolist()
            )
        else:
            lab_rooms = []

        if not lab_rooms:
            lab_rooms = self.rooms[room_name_col].astype(str).tolist()

        return lab_rooms

    def _build_assistant_pool(self) -> Tuple[List[str], Dict[str, str]]:
        assistant_id_col = find_column(
            self.assistants,
            ["Assistant_ID", "ID", "Instructor_ID", "TA_ID"],
            required=False,
        )
        assistant_name_col = find_column(
            self.assistants,
            ["Assistant_Name", "Name", "Instructor_Name", "TA_Name"],
            required=False,
        )

        if assistant_name_col is None and len(self.assistants.columns) > 0:
            assistant_name_col = self.assistants.columns[-1]
        if assistant_id_col is None and len(self.assistants.columns) > 0:
            assistant_id_col = self.assistants.columns[0]

        assistant_id_to_name: Dict[str, str] = {}
        if assistant_id_col is not None and assistant_name_col is not None:
            for _, arow in self.assistants.iterrows():
                aid = str(arow[assistant_id_col]).strip()
                aname = str(arow[assistant_name_col]).strip()
                if aid and aname:
                    assistant_id_to_name[aid] = aname

        assistant_pool: List[str] = []
        if assistant_name_col is not None:
            assistant_pool = (
                self.assistants[assistant_name_col]
                .dropna()
                .astype(str)
                .map(lambda value: assistant_id_to_name.get(value.strip(), value.strip()))
                .tolist()
            )

        if not assistant_pool:
            assistant_pool = ["TBA"]

        return assistant_pool, assistant_id_to_name

    def _build_division_students(self) -> Dict[str, Any]:
        div_id_col = find_column(
            self.divisions, ["Num_ID", "Division", "Division_ID", "Group_ID"], required=False
        )
        div_students_col = find_column(
            self.divisions, ["StudentNum", "Students", "Student_Count"], required=False
        )

        division_students: Dict[str, Any] = {}
        if div_id_col and div_students_col:
            for _, drow in self.divisions.iterrows():
                did = str(drow[div_id_col]).strip()
                try:
                    division_students[did] = int(float(drow[div_students_col])) // 2
                except (TypeError, ValueError):
                    division_students[did] = ""

        return division_students

    def _build_course_instructor_map(self) -> Dict[str, str]:
        course_instructor_from_data: Dict[str, str] = {}
        if {"Course_Name", "Instructor_ID"}.issubset(self.courses.columns) and {
            "Instructor_ID",
            "Instructor_Name",
        }.issubset(self.doctors.columns):
            doctors_lookup = {
                str(row["Instructor_ID"]).strip(): str(row["Instructor_Name"]).strip()
                for _, row in self.doctors.iterrows()
            }
            for _, row in self.courses.iterrows():
                cname = str(row["Course_Name"]).strip()
                iid = str(row["Instructor_ID"]).strip()
                iname = doctors_lookup.get(iid, "")
                if cname and iname:
                    course_instructor_from_data[cname] = iname

        return course_instructor_from_data

    def _build_course_defaults(self, cp_slots: pd.DataFrame) -> Dict[str, Dict[str, str]]:
        course_defaults: Dict[str, Dict[str, str]] = {}
        for _, crow in cp_slots.iterrows():
            cname = str(crow.get("Course_Name", "")).strip()
            if cname and cname not in course_defaults:
                course_defaults[cname] = {
                    "Instructor_Name": str(crow.get("Instructor_Name", "")).strip(),
                    "Major": str(crow.get("Major", "")).strip(),
                }
        return course_defaults

    def _format_cp_output(self, cp_schedule: pd.DataFrame) -> pd.DataFrame:
        cp_formatted = cp_schedule.copy()
        if "Assistant_Name" not in cp_formatted.columns:
            cp_formatted["Assistant_Name"] = ""
        for col in FINAL_COLS:
            if col not in cp_formatted.columns:
                cp_formatted[col] = ""
        return cp_formatted[FINAL_COLS]

    def _write_output_excel(
        self,
        target_path: Path,
        combined_schedule: pd.DataFrame,
        cp_formatted: pd.DataFrame,
        section_schedule: pd.DataFrame,
    ) -> Path:
        target_path.parent.mkdir(parents=True, exist_ok=True)
        written_path = target_path

        try:
            self._save_workbook(
                written_path, combined_schedule, cp_formatted, section_schedule
            )
        except PermissionError:
            fallback_path = target_path.with_name(
                f"{target_path.stem}_{pd.Timestamp.now():%Y%m%d_%H%M%S}{target_path.suffix}"
            )
            self._save_workbook(
                fallback_path, combined_schedule, cp_formatted, section_schedule
            )
            written_path = fallback_path

        return written_path

    @staticmethod
    def _save_workbook(
        target_path: Path,
        combined_schedule: pd.DataFrame,
        cp_formatted: pd.DataFrame,
        section_schedule: pd.DataFrame,
    ) -> None:
        with pd.ExcelWriter(target_path, engine="openpyxl") as writer:
            combined_schedule.to_excel(writer, sheet_name="Schedule", index=False)
            cp_formatted.to_excel(writer, sheet_name="CP_Only", index=False)
            section_schedule.to_excel(writer, sheet_name="Sections_Only", index=False)


def dataframe_to_schedule_entries(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Convert a schedule dataframe to API-friendly dicts."""
    entries: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        entries.append(
            {
                "day": str(row.get("Day", "")),
                "course_name": str(row.get("Course_Name", "")),
                "instructor_name": str(row.get("Instructor_Name", "")),
                "assistant_name": str(row.get("Assistant_Name", "")),
                "students": row.get("Students", ""),
                "room": str(row.get("Room", "")),
                "start_time": str(row.get("Start_Time", "")),
                "end_time": str(row.get("End_Time", "")),
                "major": str(row.get("Major", "")),
            }
        )
    return entries
