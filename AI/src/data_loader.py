"""Data loader for CP scheduling (JSON or Excel)."""

from pathlib import Path
from typing import Any, Dict, List, Tuple

import pandas as pd

from .utils import time_to_minutes


DEFAULT_DATA_PATH = Path("data/Raw Data/Data.xlsx")
DEFAULT_CP_OUTPUT_PATH = Path("data/Processed Data/Schedule_Output_CP.xlsx")


class DataLoader:
    """Load and prepare scheduling data from JSON or Excel."""

    def __init__(self) -> None:
        self.rooms_data: List[Dict[str, Any]] = []
        self.courses_data: List[Dict[str, Any]] = []
        self.doctors_data: List[Dict[str, Any]] = []
        self.divisions_data: List[Dict[str, Any]] = []

        self.room_dict: Dict[str, Dict[str, Any]] = {}
        self.course_dict: Dict[str, Dict[str, Any]] = {}
        self.doctor_availability: Dict[str, Dict[str, List[Tuple[int, int]]]] = {}
        self.division_dict: Dict[str, Dict[str, Any]] = {}
        self.lecture_rooms: List[str] = []
        self.lab_rooms: List[str] = []

        self.rooms_df = pd.DataFrame()
        self.courses_df = pd.DataFrame()
        self.doctors_df = pd.DataFrame()
        self.divisions_df = pd.DataFrame()

        self._is_loaded = False

    def load_from_json(self, data: Dict[str, List[Dict[str, Any]]]) -> bool:
        """Load all data from JSON input."""
        try:
            self.rooms_data = data.get("rooms", [])
            self.courses_data = data.get("courses", [])
            self.doctors_data = data.get("doctors", [])
            self.divisions_data = data.get("divisions", [])
            self._prepare_data()
            self._is_loaded = True
            return True
        except Exception as exc:
            print(f"Error loading data from JSON: {exc}")
            return False

    def load_from_excel(self, data_path: Path = DEFAULT_DATA_PATH) -> bool:
        """Load scheduling data from Data.xlsx (Final CP notebook)."""
        try:
            self.rooms_df = pd.read_excel(data_path, sheet_name="Rooms")
            self.courses_df = pd.read_excel(data_path, sheet_name="Courses")
            self.doctors_df = pd.read_excel(data_path, sheet_name="Doctors")
            self.divisions_df = pd.read_excel(data_path, sheet_name="Division")

            self.rooms_data = self.rooms_df.to_dict("records")
            self.courses_data = self.courses_df.to_dict("records")
            self.doctors_data = self.doctors_df.to_dict("records")
            self.divisions_data = self.divisions_df.to_dict("records")

            self._prepare_data()
            self._is_loaded = True
            return True
        except Exception as exc:
            print(f"Error loading data from Excel: {exc}")
            return False

    def _prepare_data(self) -> None:
        """Prepare data structures for the CP scheduler."""
        self.room_dict = {
            room["Room_ID"]: {
                "capacity": room["Capacity"],
                "type": room["Type"],
                "name": room["Room"],
            }
            for room in self.rooms_data
        }

        self.course_dict = {
            course["Course_ID"]: {
                "instructor": course["Instructor_ID"],
                "days": course["Days"],
                "hours_per_day": course["Hours_per_day"],
                "type": course["Type"],
                "year": course["Year"],
                "major": course["Major"],
                "department": course["Department"],
                "name": course["Course_Name"],
            }
            for course in self.courses_data
        }

        self.doctor_availability = {}
        for doctor in self.doctors_data:
            inst_id = doctor["Instructor_ID"]
            day = doctor["Day"]
            start_minutes = time_to_minutes(doctor["Start_Time"])
            end_minutes = time_to_minutes(doctor["End_Time"])

            if inst_id not in self.doctor_availability:
                self.doctor_availability[inst_id] = {}
            if day not in self.doctor_availability[inst_id]:
                self.doctor_availability[inst_id][day] = []
            self.doctor_availability[inst_id][day].append((start_minutes, end_minutes))

        self.division_dict = {
            div["Num_ID"]: {
                "students": div["StudentNum"],
                "year": div["Year"],
                "major": div["Major"],
                "department": div["Department"],
            }
            for div in self.divisions_data
        }

        self.lecture_rooms = [
            room_id
            for room_id, info in self.room_dict.items()
            if info["type"] == "Lecture"
        ]
        self.lab_rooms = [
            room_id for room_id, info in self.room_dict.items() if info["type"] == "Lab"
        ]

        if self.rooms_data:
            self.rooms_df = pd.DataFrame(self.rooms_data)
        if self.courses_data:
            self.courses_df = pd.DataFrame(self.courses_data)
        if self.doctors_data:
            self.doctors_df = pd.DataFrame(self.doctors_data)
        if self.divisions_data:
            self.divisions_df = pd.DataFrame(self.divisions_data)

    def is_loaded(self) -> bool:
        return self._is_loaded

    def get_stats(self) -> Dict[str, int]:
        unique_doctors = (
            {doctor["Instructor_ID"] for doctor in self.doctors_data}
            if self.doctors_data
            else set()
        )
        return {
            "courses": len(self.course_dict),
            "rooms": len(self.room_dict),
            "doctors": len(unique_doctors),
            "divisions": len(self.division_dict),
            "lecture_rooms": len(self.lecture_rooms),
            "lab_rooms": len(self.lab_rooms),
        }
