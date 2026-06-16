"""Pydantic models for the CP Scheduler API."""

from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel, Field, field_validator


class RoomType(str, Enum):
    LAB = "Lab"
    LECTURE = "Lecture"


class CPConfig(BaseModel):
    """Configuration for the CP-SAT scheduler."""
    time_limit_seconds: int = Field(default=300, ge=10, le=3600)
    max_days_per_year: int = Field(default=3, ge=1, le=7)
    relax_if_infeasible: bool = Field(default=True)


class ScheduleEntry(BaseModel):
    """A single entry in the generated CP schedule."""
    day: str
    course_name: str
    instructor_name: str
    students: int
    room: str
    start_time: str
    end_time: str
    department: str
    major: str
    year: int = 0


class RoomInput(BaseModel):
    Room_ID: str
    Room: str
    Capacity: int
    Type: str


class CourseInput(BaseModel):
    Course_ID: str
    Course_Name: str
    Department: str
    Major: str
    Days: int
    Hours_per_day: int
    Instructor_ID: str
    Year: int
    Type: str

    @field_validator("Days")
    @classmethod
    def validate_days(cls, value: int) -> int:
        if value < 1 or value > 6:
            raise ValueError(f"Days must be between 1 and 6, got {value}")
        return value


class DoctorInput(BaseModel):
    Instructor_ID: str
    Instructor_Name: str
    Department: str
    Day: str
    Start_Time: str
    End_Time: str


class DivisionInput(BaseModel):
    Num_ID: str
    Department: str
    Major: str
    Year: int
    StudentNum: int


class SchedulingDataInput(BaseModel):
    rooms: List[RoomInput]
    courses: List[CourseInput]
    doctors: List[DoctorInput]
    divisions: List[DivisionInput]


class ScheduleRequest(BaseModel):
    config: Optional[CPConfig] = None
    data: SchedulingDataInput = Field(..., description="Scheduling data as JSON")
    write_output: bool = Field(default=False)
    output_path: Optional[str] = None


class CPFileScheduleRequest(BaseModel):
    data_path: Optional[str] = Field(default=None, description="Path to Data.xlsx")
    output_path: Optional[str] = Field(
        default=None,
        description="Path for Schedule_Output_CP.xlsx",
    )
    write_output: bool = Field(default=True)
    config: Optional[CPConfig] = None


class ScheduleResponse(BaseModel):
    success: bool
    message: str
    schedule: List[ScheduleEntry] = []
    total_assignments: int = 0
    solver_status: Optional[str] = None
    max_days_per_year_used: Optional[int] = None
    output_path: Optional[str] = None
    elapsed_seconds: float = 0.0


class HealthResponse(BaseModel):
    status: str
    message: str
    version: str = "2.0.0"


# --- Section scheduling models (Final S Cp) ---


class CPScheduleEntryInput(BaseModel):
    Day: str
    Course_Name: str
    Start_Time: str
    End_Time: str
    Instructor_Name: str = ""
    Assistant_Name: str = ""
    Students: Any = ""
    Room: str = ""
    Major: str = ""


class SectionRoomInput(BaseModel):
    Room: str
    Type: Optional[str] = None
    Room_ID: Optional[str] = None
    Capacity: Optional[int] = None


class SectionInput(BaseModel):
    Course_Name: Optional[str] = None
    Division: Optional[str] = None
    Section: Optional[str] = None
    Instructor_Name: Optional[str] = None
    Num_ID: Optional[str] = None
    Major: Optional[str] = None


class AssistantInput(BaseModel):
    Assistant_Name: str
    Assistant_ID: Optional[str] = None


class SectionDataInput(BaseModel):
    cp_schedule: List[CPScheduleEntryInput]
    rooms: List[SectionRoomInput]
    sections: List[SectionInput]
    assistants: List[AssistantInput]
    divisions: List[DivisionInput]
    courses: List[CourseInput]
    doctors: List[DoctorInput]


class SectionScheduleRequest(BaseModel):
    data: SectionDataInput = Field(..., description="CP schedule and section data as JSON")
    write_output: bool = Field(default=False)
    output_path: Optional[str] = None


class SectionFileScheduleRequest(BaseModel):
    cp_output_path: Optional[str] = None
    sdata_path: Optional[str] = None
    data_path: Optional[str] = None
    output_path: Optional[str] = None
    write_output: bool = Field(default=True)


class FullScheduleFileRequest(BaseModel):
    """Run CP then section scheduling from Excel files."""
    data_path: Optional[str] = None
    sdata_path: Optional[str] = None
    cp_output_path: Optional[str] = None
    output_path: Optional[str] = None
    write_output: bool = Field(default=True)
    cp_config: Optional[CPConfig] = None


class SectionScheduleEntry(BaseModel):
    day: str
    course_name: str
    instructor_name: str
    assistant_name: str = ""
    students: Any = ""
    room: str = ""
    start_time: str = ""
    end_time: str = ""
    major: str = ""


class SectionScheduleResponse(BaseModel):
    success: bool
    message: str
    schedule: List[SectionScheduleEntry] = []
    cp_schedule: List[SectionScheduleEntry] = []
    sections_schedule: List[SectionScheduleEntry] = []
    cp_rows: int = 0
    section_rows: int = 0
    total_rows: int = 0
    unassigned_sections: int = 0
    output_path: Optional[str] = None
    elapsed_seconds: float = 0.0


class FullScheduleResponse(BaseModel):
    success: bool
    message: str
    cp_result: ScheduleResponse
    section_result: SectionScheduleResponse
