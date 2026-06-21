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
        lab_rooms = self._get_lab_rooms()
        assistant_pool, assistant_id_to_name = self._build_assistant_pool()
        division_students = self._build_division_students()
        course_instructor_from_data = self._build_course_instructor_map()
        course_defaults = self._build_course_defaults(cp_slots)

        sec_course_col = find_column(
            self.sections, ["Course_Name", "Course", "Subject"], required=False
        )
        sec_div_col = find_column(
            self.sections,
            ["Division", "Num_ID", "Division_ID", "Group_ID", "Group", "Major"],
            required=False,
        )
        sec_name_col = find_column(
            self.sections, ["Section", "Section_Name", "Sec", "Name"], required=False
        )
        sec_inst_col = find_column(
            self.sections,
            [
                "Instructor_Name",
                "Instructor",
                "Doctor",
                "Assistant",
                "Assistant_Name",
                "TA",
            ],
            required=False,
        )

        def normalize_instructor_name(value: Any) -> str:
            raw = "" if value is None else str(value).strip()
            return assistant_id_to_name.get(raw, raw)

        room_busy: set = set()
        instructor_busy: set = set()
        section_busy: set = set()
        section_rows: List[Dict[str, Any]] = []
        auto_instructor_idx = 0

        for i, sec in self.sections.iterrows():
            course_name = str(sec[sec_course_col]).strip() if sec_course_col else ""
            division_name = str(sec[sec_div_col]).strip() if sec_div_col else ""
            section_name = (
                str(sec[sec_name_col]).strip() if sec_name_col else f"Section_{i + 1}"
            )

            if (
                sec_inst_col
                and pd.notna(sec[sec_inst_col])
                and str(sec[sec_inst_col]).strip()
            ):
                section_assistant = normalize_instructor_name(sec[sec_inst_col])
            else:
                section_assistant = normalize_instructor_name(
                    assistant_pool[auto_instructor_idx % len(assistant_pool)]
                )
                auto_instructor_idx += 1

            defaults = course_defaults.get(course_name, {})
            section_instructor_name = course_instructor_from_data.get(
                course_name
            ) or defaults.get("Instructor_Name", "")

            candidates = cp_slots.copy()
            if course_name:
                by_course = candidates[
                    candidates["Course_Name"].astype(str).str.strip() == course_name
                ]
                if not by_course.empty:
                    candidates = by_course
            if division_name:
                by_major = candidates[
                    candidates["Major"].astype(str).str.strip() == division_name
                ]
                if not by_major.empty:
                    candidates = by_major

            assigned = False
            for _, slot in candidates.iterrows():
                day = str(slot["Day"]).strip()
                start_time = str(slot["Start_Time"]).strip()
                end_time = str(slot["End_Time"]).strip()

                for room in lab_rooms:
                    room_key = (day, start_time, end_time, room)
                    inst_key = (day, start_time, end_time, section_assistant)
                    sec_key = (day, start_time, end_time, section_name)

                    if (
                        room_key in room_busy
                        or inst_key in instructor_busy
                        or sec_key in section_busy
                    ):
                        continue

                    room_busy.add(room_key)
                    instructor_busy.add(inst_key)
                    section_busy.add(sec_key)

                    slot_defaults = course_defaults.get(course_name, {})
                    students = division_students.get(division_name, "")

                    section_rows.append(
                        {
                            "Day": day,
                            "Course_Name": course_name
                            if course_name
                            else str(slot["Course_Name"]),
                            "Instructor_Name": section_instructor_name,
                            "Assistant_Name": section_assistant,
                            "Students": students,
                            "Room": room,
                            "Start_Time": start_time,
                            "End_Time": end_time,
                            "Major": division_name
                            if division_name
                            else slot_defaults.get("Major", ""),
                        }
                    )
                    assigned = True
                    break

                if assigned:
                    break

            if not assigned:
                slot_defaults = course_defaults.get(course_name, {})
                students = division_students.get(division_name, "")

                section_rows.append(
                    {
                        "Day": "UNASSIGNED",
                        "Course_Name": course_name,
                        "Instructor_Name": section_instructor_name,
                        "Assistant_Name": section_assistant,
                        "Students": students,
                        "Room": "",
                        "Start_Time": "",
                        "End_Time": "",
                        "Major": division_name
                        if division_name
                        else slot_defaults.get("Major", ""),
                    }
                )

        section_schedule = pd.DataFrame(section_rows)
        cp_formatted = self._format_cp_output(self.cp_schedule)
        combined_schedule = pd.concat(
            [cp_formatted, section_schedule[FINAL_COLS]], ignore_index=True
        )

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
