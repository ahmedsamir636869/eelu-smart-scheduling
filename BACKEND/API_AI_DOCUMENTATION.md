# Backend ↔ AI Scheduling Integration

The backend integrates with the Python **CP-SAT** scheduling microservice (FastAPI) to generate
lecture and section schedules. This document describes the backend endpoint, the data flow, and the
request/response contracts the backend uses when calling the AI service.

> The AI service is configured via `AI_API_URL` (default `http://localhost:8000`). See
> [src/config/env.js](src/config/env.js).

---

## Backend endpoint

### `POST /api/v1/schedule/generate`

Generates a schedule for a campus. Admin only.

**Request body:**
```json
{
  "campusId": "cmxxxxxxxxxxxxxxxxxxxxxxx",
  "semester": "Fall 2026",
  "scheduleType": "all"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| campusId | string (CUID) | yes | Campus to generate the schedule for |
| semester | string | yes | Semester label (2-100 chars) |
| scheduleType | string | no | `lectures`, `sections`, or `all` (default `all`) |

- `lectures`: run CP and save only lecture sessions.
- `sections`: run CP (for time slots) and save only section sessions.
- `all`: run CP and save both lecture and section sessions under one schedule.

**Response (201):**
```json
{
  "success": true,
  "message": "Schedule generated successfully",
  "schedule": {
    "id": "cm...",
    "semester": "Fall 2026",
    "generatedBy": "AI-CP",
    "sessions": [ /* LECTURE and/or SECTION sessions with course/instructor/classroom */ ],
    "totalSessions": 0
  }
}
```

Other routes: `GET /api/v1/schedule` (all schedules), `GET /api/v1/schedule/:id` (one schedule).

---

## Data flow

```text
Backend (Express) ──► AI CP-SAT service (FastAPI)
   1. Fetch campus data from Postgres (Prisma)
   2. Transform to AI payloads
   3. POST /cp/generate           → lecture schedule rows (JSON)
   4. (sections) POST /sections/generate x2 (practical+LAB, theoretical+LECTURE) → section rows
   5. Persist Schedule + Session rows in Postgres
```

The AI service is **stateless** in this flow: it returns JSON and writes nothing to disk (the backend
never sets `write_output`). The persistent system of record is the backend database (`Schedule` + `Session`).

### Terminology mapping (AI ↔ backend)

- `doctors` (AI) === `Instructor` (backend) — lecture professors.
- `assistants` (AI) === `TA` (backend) — section teachers.
- In a section row, `Instructor_Name` is the course's doctor and `Assistant_Name` is the TA.

---

## AI request: `POST {AI_API_URL}/cp/generate`

```json
{
  "data": {
    "rooms": [
      { "Room_ID": "cm...", "Room": "Hall A", "Capacity": 100, "Type": "Lecture" }
    ],
    "courses": [
      {
        "Course_ID": "cs101",
        "Course_Name": "Introduction to Programming",
        "Department": "CS",
        "Major": "CS",
        "Days": 2,
        "Hours_per_day": 2,
        "Instructor_ID": "cm...",
        "Year": 1,
        "Type": "Lecture"
      }
    ],
    "doctors": [
      {
        "Instructor_ID": "cm...",
        "Instructor_Name": "Dr. Ahmed",
        "Department": "CS",
        "Day": "Sunday",
        "Start_Time": "09:00",
        "End_Time": "17:00"
      }
    ],
    "divisions": [
      { "Num_ID": "CS-1-A", "Department": "CS", "Major": "CS", "Year": 1, "StudentNum": 50 }
    ]
  },
  "config": {
    "time_limit_seconds": 300,
    "max_days_per_year": 3,
    "relax_if_infeasible": true
  }
}
```

**Notes on transforms (see [src/services/ai-integration.service.js](src/services/ai-integration.service.js)):**
- `Room.Type`: `LECTURE_HALL → "Lecture"`, `LAB → "Lab"`.
- `Course.Type`: `THEORETICAL → "Lecture"`, `PRACTICAL → "Lab"`.
- `doctors`: one row per **APPROVED** `InstructorAvailability` entry (`Day`, `Start_Time`, `End_Time`).
  Instructors with no approved availability fall back to all working days `09:00–17:00`.

**`config` (CPConfig):**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| time_limit_seconds | int | 300 | Solver time budget (10-3600) |
| max_days_per_year | int | 3 | Max teaching days per academic year (1-7) |
| relax_if_infeasible | bool | true | Relax constraints if no solution is found |

**Response:**
```json
{
  "success": true,
  "message": "CP schedule generated ...",
  "total_assignments": 106,
  "solver_status": "OPTIMAL",
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
      "major": "IT",
      "year": 1
    }
  ]
}
```

---

## AI request: `POST {AI_API_URL}/sections/generate`

To place practical-course sections in labs and theoretical-course sections in lecture rooms, the
backend makes **two calls** (the AI picks rooms purely from the supplied `rooms` list: it prefers
"lab"-typed rooms, otherwise falls back to all supplied rooms):

1. Practical courses + only `LAB` rooms.
2. Theoretical courses + only `LECTURE_HALL` rooms.

The section input list is derived from courses × matching student groups (same department + year), with
each group split into `ceil(studentCount / sectionSize)` sections (`sectionSize` = min capacity of the
relevant room type, fallback `25`). `Instructor_Name` is left empty so the AI auto-assigns a TA.

```json
{
  "data": {
    "cp_schedule": [
      { "Day": "Monday", "Course_Name": "Mathematics (0)", "Start_Time": "2:00 PM", "End_Time": "3:00 PM", "Instructor_Name": "Dr. Amany", "Assistant_Name": "", "Students": 219, "Room": "Terrace 8", "Major": "IT" }
    ],
    "rooms": [ { "Room_ID": "cm...", "Room": "Lab 1", "Capacity": 30, "Type": "Lab" } ],
    "sections": [
      { "Course_Name": "Programming Lab", "Major": "CS", "Division": "CS-1-A", "Section": "S-01", "Instructor_Name": "" }
    ],
    "assistants": [ { "Assistant_ID": "cm...", "Assistant_Name": "Eng. Mona" } ],
    "divisions": [ { "Num_ID": "CS-1-A", "Department": "CS", "Major": "CS", "Year": 1, "StudentNum": 50 } ],
    "courses": [ /* same shape as /cp/generate courses */ ],
    "doctors": [ /* same shape as /cp/generate doctors */ ]
  }
}
```

**Response (section rows used by the backend are in `sections_schedule`):**
```json
{
  "success": true,
  "sections_schedule": [
    {
      "day": "Tuesday",
      "course_name": "Programming Lab",
      "instructor_name": "Dr. Ahmed",
      "assistant_name": "Eng. Mona",
      "students": 25,
      "room": "Lab 1",
      "start_time": "10:00 AM",
      "end_time": "12:00 PM",
      "major": "CS"
    }
  ]
}
```

The backend saves each row as a `Session(type=SECTION)`: `assistant_name` resolves to a `TA` (and its
linked `User` is set as `instructorId` when available); `UNASSIGNED` rows are stored with null day/time.

---

## Running the AI service

```bash
cd AI
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

Interactive docs: http://localhost:8000/docs

---

## Out of scope / limitations

- The AI section scheduler is a greedy, conflict-free assigner. It does NOT enforce the detailed TA
  rules in `AI/Sections Instructions.txt` (4-day TA spread, 3h-consecutive / 5h-daily caps,
  >50% supervision). Full compliance is AI-side work.
- `Session` has no dedicated `taId`; the assigned TA is linked via `instructorId` (TA's `User`) when
  available and kept in the session name otherwise.

---

Part of the Graduation Project - University Course Scheduling System
