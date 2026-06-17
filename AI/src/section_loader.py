"""Load section scheduling data from Excel files or JSON."""

from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd


DEFAULT_CP_OUTPUT_PATH = Path("data/Processed Data/Schedule_Output_CP.xlsx")
DEFAULT_SDATA_PATH = Path("data/Raw Data/SData.xlsx")
DEFAULT_DATA_PATH = Path("data/Raw Data/Data.xlsx")
DEFAULT_OUTPUT_PATH = Path("data/Processed Data/Schedule_Output_S.xlsx")


class SectionDataLoader:
    """Load CP schedule and section-related workbooks."""

    def __init__(self) -> None:
        self.cp_schedule: pd.DataFrame = pd.DataFrame()
        self.rooms: pd.DataFrame = pd.DataFrame()
        self.sections: pd.DataFrame = pd.DataFrame()
        self.assistants: pd.DataFrame = pd.DataFrame()
        self.divisions: pd.DataFrame = pd.DataFrame()
        self.courses: pd.DataFrame = pd.DataFrame()
        self.doctors: pd.DataFrame = pd.DataFrame()
        self._is_loaded = False

    def load_section_sheets(
        self,
        sdata_path: Path,
        data_path: Path,
        cp_schedule: pd.DataFrame | None = None,
        cp_output_path: Path | None = None,
    ) -> bool:
        """Load section data, optionally using an in-memory CP schedule."""
        try:
            if cp_schedule is not None:
                self.cp_schedule = cp_schedule.copy()
            elif cp_output_path is not None:
                self.cp_schedule = pd.read_excel(cp_output_path, sheet_name="Schedule")
            else:
                raise ValueError("Provide cp_schedule or cp_output_path")

            self.rooms = pd.read_excel(sdata_path, sheet_name="Rooms")
            self.sections = pd.read_excel(sdata_path, sheet_name="Section")
            self.assistants = pd.read_excel(sdata_path, sheet_name="Assistant")
            self.divisions = pd.read_excel(sdata_path, sheet_name="Division")
            self.courses = pd.read_excel(data_path, sheet_name="Courses")
            self.doctors = pd.read_excel(data_path, sheet_name="Doctors")
            self._is_loaded = True
            return True
        except Exception as exc:
            print(f"Error loading section sheets: {exc}")
            return False

    def load_from_excel(
        self,
        cp_output_path: Path = DEFAULT_CP_OUTPUT_PATH,
        sdata_path: Path = DEFAULT_SDATA_PATH,
        data_path: Path = DEFAULT_DATA_PATH,
    ) -> bool:
        """Load all required sheets from Excel workbooks."""
        return self.load_section_sheets(
            sdata_path=sdata_path,
            data_path=data_path,
            cp_output_path=cp_output_path,
        )

    def load_from_json(self, data: Dict[str, List[Dict[str, Any]]]) -> bool:
        """Load section scheduling data from a JSON payload."""
        try:
            self.cp_schedule = pd.DataFrame(data.get("cp_schedule", []))
            self.rooms = pd.DataFrame(data.get("rooms", []))
            self.sections = pd.DataFrame(data.get("sections", []))
            self.assistants = pd.DataFrame(data.get("assistants", []))
            self.divisions = pd.DataFrame(data.get("divisions", []))
            self.courses = pd.DataFrame(data.get("courses", []))
            self.doctors = pd.DataFrame(data.get("doctors", []))
            self._is_loaded = True
            return True
        except Exception as exc:
            print(f"Error loading section data from JSON: {exc}")
            return False

    def is_loaded(self) -> bool:
        return self._is_loaded

    def get_stats(self) -> Dict[str, int]:
        return {
            "cp_rows": len(self.cp_schedule),
            "sections_rows": len(self.sections),
            "rooms_rows": len(self.rooms),
            "assistants_rows": len(self.assistants),
            "divisions_rows": len(self.divisions),
        }
