"""
Pydantic models for the GA Scheduler API.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from enum import Enum


class RoomType(str, Enum):
    LAB = "Lab"
    LECTURE = "Lecture"


class Room(BaseModel):
    """Room model for scheduling."""
    room_id: str = Field(..., alias="Room_ID")
    name: str = Field(..., alias="Room")
    capacity: int = Field(..., alias="Capacity")
    type: RoomType = Field(..., alias="Type")

    class Config:
        populate_by_name = True


class Course(BaseModel):
    """Course model for scheduling."""
    course_id: str = Field(..., alias="Course_ID")
    course_name: str = Field(..., alias="Course_Name")
    department: str = Field(..., alias="Department")
    major: str = Field(..., alias="Major")
    days: int = Field(..., alias="Days")
    hours_per_day: int = Field(..., alias="Hours_per_day")
    instructor_id: str = Field(..., alias="Instructor_ID")
    year: int = Field(..., alias="Year")
    type: RoomType = Field(..., alias="Type")
    duration: Optional[str] = Field(None, alias="Duration")

    @field_validator('days')
    @classmethod
    def validate_days(cls, v):
        """Validate that days is between 1 and 6."""
        if v < 1 or v > 6:
            raise ValueError(f'Days must be between 1 and 6, got {v}')
        return v

    class Config:
        populate_by_name = True


class Doctor(BaseModel):
    """Doctor/Instructor model."""
    instructor_id: str = Field(..., alias="Instructor_ID")
    instructor_name: str = Field(..., alias="Instructor_Name")
    department: str = Field(..., alias="Department")
    day: str = Field(..., alias="Day")
    start_time: str = Field(..., alias="Start_Time")
    end_time: str = Field(..., alias="End_Time")

    class Config:
        populate_by_name = True


class Division(BaseModel):
    """Division/Student group model."""
    num_id: str = Field(..., alias="Num_ID")
    department: str = Field(..., alias="Department")
    major: str = Field(..., alias="Major")
    year: int = Field(..., alias="Year")
    student_num: int = Field(..., alias="StudentNum")

    class Config:
        populate_by_name = True


class GAConfig(BaseModel):
    """Configuration for the Genetic Algorithm."""
    population_size: int = Field(default=50, ge=10, le=500)
    generations: int = Field(default=100, ge=10, le=1000)
    mutation_rate: float = Field(default=0.15, ge=0.0, le=1.0)
    crossover_rate: float = Field(default=0.8, ge=0.0, le=1.0)


class ScheduleEntry(BaseModel):
    """A single entry in the generated schedule."""
    day: str
    course_name: str
    instructor_name: str
    students: int
    room: str
    start_time: str
    end_time: str
    department: str
    major: str
    year: int


class RoomInput(BaseModel):
    """Room input from JSON."""
    Room_ID: str
    Room: str
    Capacity: int
    Type: str  # "Lab" or "Lecture"


class CourseInput(BaseModel):
    """Course input from JSON."""
    Course_ID: str
    Course_Name: str
    Department: str
    Major: str
    Days: int
    Hours_per_day: int
    Instructor_ID: str
    Year: int
    Type: str  # "Lab" or "Lecture"

    @field_validator('Days')
    @classmethod
    def validate_days(cls, v):
        """Validate that Days is between 1 and 6."""
        if v < 1 or v > 6:
            raise ValueError(f'Days must be between 1 and 6, got {v}')
        return v


class DoctorInput(BaseModel):
    """Doctor/Instructor availability input from JSON."""
    Instructor_ID: str
    Instructor_Name: str
    Department: str
    Day: str
    Start_Time: str
    End_Time: str


class DivisionInput(BaseModel):
    """Division/Student group input from JSON."""
    Num_ID: str
    Department: str
    Major: str
    Year: int
    StudentNum: int


class SchedulingDataInput(BaseModel):
    """Complete scheduling data input from JSON."""
    rooms: List[RoomInput]
    courses: List[CourseInput]
    doctors: List[DoctorInput]
    divisions: List[DivisionInput]


class ScheduleRequest(BaseModel):
    """Request model for schedule generation."""
    config: Optional[GAConfig] = None
    data: SchedulingDataInput = Field(..., description="Scheduling data as JSON")


class ScheduleResponse(BaseModel):
    """Response model for generated schedule."""
    success: bool
    message: str
    schedule: List[ScheduleEntry] = []
    total_assignments: int = 0
    fitness_score: float = 0.0
    generations_run: int = 0


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    message: str
    version: str = "1.0.0"
