# GA Scheduler API Documentation

A Python FastAPI microservice that uses **Genetic Algorithm** to generate optimal university course schedules.

## Overview

This API accepts scheduling data as **JSON** and uses a Genetic Algorithm to find the best schedule that:
- Avoids instructor conflicts
- Avoids room conflicts  
- Avoids student group (division) conflicts
- Respects room capacities
- Matches room types (Lab/Lecture) to course types
- Follows instructor availability

---

## Quick Start

### Installation
```bash
pip install -r requirements.txt
```

### Run the Server
```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Interactive Docs
Open your browser to: **http://localhost:8000/docs**

---

## API Endpoints

### `GET /`
**Root endpoint** - Returns API info

**Response:**
```json
{
  "name": "GA Scheduler API",
  "version": "1.0.0",
  "description": "Genetic Algorithm based course scheduling microservice",
  "endpoints": {
    "health": "/health",
    "generate_schedule": "/schedule/generate",
    "docs": "/docs"
  }
}
```

---

### `GET /health`
**Health check** - Verify API is running

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running. Send JSON data to /schedule/generate to create a schedule.",
  "version": "1.0.0"
}
```

---

### `POST /schedule/generate`
**Generate schedule** - Run the GA to create an optimized schedule

**Request Body (required):**
```json
{
  "data": {
    "rooms": [
      {
        "Room_ID": "R1",
        "Room": "Hall A",
        "Capacity": 100,
        "Type": "Lecture"
      }
    ],
    "courses": [
      {
        "Course_ID": "CS101",
        "Course_Name": "Introduction to Programming",
        "Department": "CS",
        "Major": "CS",
        "Days": 2,
        "Hours_per_day": 2,
        "Instructor_ID": "D1",
        "Year": 1,
        "Type": "Lecture"
      }
    ],
    "doctors": [
      {
        "Instructor_ID": "D1",
        "Instructor_Name": "Dr. Ahmed",
        "Department": "CS",
        "Day": "Sunday",
        "Start_Time": "09:00",
        "End_Time": "17:00"
      }
    ],
    "divisions": [
      {
        "Num_ID": "DIV1",
        "Department": "CS",
        "Major": "CS",
        "Year": 1,
        "StudentNum": 50
      }
    ]
  },
  "config": {
    "population_size": 50,
    "generations": 100,
    "mutation_rate": 0.15,
    "crossover_rate": 0.8
  }
}
```

**Data Fields:**

#### rooms
| Field | Type | Description |
|-------|------|-------------|
| Room_ID | string | Unique room identifier |
| Room | string | Room name |
| Capacity | int | Student capacity |
| Type | string | "Lab" or "Lecture" |

#### courses
| Field | Type | Description |
|-------|------|-------------|
| Course_ID | string | Unique course identifier |
| Course_Name | string | Course name |
| Department | string | Department code |
| Major | string | Major code |
| Days | int | Days per week |
| Hours_per_day | int | Duration in hours |
| Instructor_ID | string | Assigned instructor |
| Year | int | Student year (1-4) |
| Type | string | "Lab" or "Lecture" |

#### doctors
| Field | Type | Description |
|-------|------|-------------|
| Instructor_ID | string | Instructor identifier |
| Instructor_Name | string | Full name |
| Department | string | Department |
| Day | string | Available day |
| Start_Time | string | Availability start (HH:MM format) |
| End_Time | string | Availability end (HH:MM format) |

#### divisions
| Field | Type | Description |
|-------|------|-------------|
| Num_ID | string | Division identifier |
| Department | string | Department |
| Major | string | Major |
| Year | int | Student year |
| StudentNum | int | Number of students |

**Config Parameters (optional):**
| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| population_size | int | 50 | 10-500 | Number of schedules in population |
| generations | int | 100 | 10-1000 | Number of GA iterations |
| mutation_rate | float | 0.15 | 0-1 | Probability of mutation |
| crossover_rate | float | 0.8 | 0-1 | Probability of crossover |

**Response:**
```json
{
  "success": true,
  "message": "Schedule generated successfully in 12.34s",
  "total_assignments": 106,
  "fitness_score": 373.70,
  "generations_run": 100,
  "schedule": [
    {
      "day": "Monday",
      "course_name": "Mathematics (0)",
      "instructor_name": "Dr. Amany",
      "students": 219,
      "room": "Terrace 8",
      "start_time": "2:00 PM",
      "end_time": "3:00 PM",
      "department": "IT",
      "major": "IT"
    }
  ]
}
```

---

## Integration with Node.js Backend

```javascript
// Example: Call from Node.js
const response = await fetch('http://localhost:8000/schedule/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      rooms: [
        { Room_ID: "R1", Room: "Hall A", Capacity: 100, Type: "Lecture" },
        { Room_ID: "R2", Room: "Lab 1", Capacity: 30, Type: "Lab" }
      ],
      courses: [
        {
          Course_ID: "CS101",
          Course_Name: "Intro to Programming",
          Department: "CS",
          Major: "CS",
          Days: 2,
          Hours_per_day: 2,
          Instructor_ID: "D1",
          Year: 1,
          Type: "Lecture"
        }
      ],
      doctors: [
        {
          Instructor_ID: "D1",
          Instructor_Name: "Dr. Ahmed",
          Department: "CS",
          Day: "Sunday",
          Start_Time: "09:00",
          End_Time: "17:00"
        }
      ],
      divisions: [
        { Num_ID: "DIV1", Department: "CS", Major: "CS", Year: 1, StudentNum: 50 }
      ]
    },
    config: {
      population_size: 50,
      generations: 100
    }
  })
});

const schedule = await response.json();
console.log(`Generated ${schedule.total_assignments} assignments`);
```

---

## Project Structure

```
src/
├── __init__.py       # Package init
├── main.py           # FastAPI application
├── models.py         # Pydantic schemas (with JSON input models)
├── utils.py          # Time utilities
├── data_loader.py    # JSON data loader
└── scheduler.py      # Genetic Algorithm
```

---

## License

Part of the Graduation Project - University Course Scheduling System
