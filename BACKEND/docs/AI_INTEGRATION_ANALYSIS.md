# AI-Backend Integration Analysis

Status: **Implemented** for the CP-SAT AI service (lecture + section scheduling).

The backend integrates with the Python **CP-SAT** microservice (FastAPI). The integration lives in
[../src/services/ai-integration.service.js](../src/services/ai-integration.service.js), exposed via
`POST /api/v1/schedule/generate`. For the full request/response contracts see
[../API_AI_DOCUMENTATION.md](../API_AI_DOCUMENTATION.md).

---

## Terminology mapping (AI ↔ backend)

These names do not match 1:1:

- `doctors` (AI) === `Instructor` (backend) — lecture professors.
- `assistants` (AI) === `TA` (backend) — section teachers.
- In a section row, `Instructor_Name` is the course's doctor; `Assistant_Name` is the TA.

---

## Data mapping (Backend → AI)

| Backend (Prisma) | AI payload | Transform |
|------------------|-----------|-----------|
| `Classroom` | `rooms` | `LECTURE_HALL → "Lecture"`, `LAB → "Lab"` |
| `Course` | `courses` | `THEORETICAL → "Lecture"`, `PRACTICAL → "Lab"`; `Department`/`Major` from `department.code`; `Year` from `course.year` |
| `Instructor` + `InstructorAvailability` | `doctors` | one row per APPROVED availability; fallback to all working days `09:00–17:00` |
| `StudentGroup` | `divisions` | `Num_ID` from `name`; `StudentNum` from `studentCount` |
| `TA` | `assistants` | `Assistant_ID`/`Assistant_Name` |

Sections (input) are **derived**, not stored: courses × matching student groups (same `departmentId` +
`year`), split into `ceil(studentCount / sectionSize)` sections, where `sectionSize` is the min capacity
of the relevant room type (fallback `DEFAULT_SECTION_SIZE = 25`).

---

## Data mapping (AI → Backend)

AI returns JSON rows; the backend persists them as `Session` records under a single `Schedule`
(`generatedBy: "AI-CP"`).

- Lecture rows → `Session(type=LECTURE)` (`saveLectureSessions`). Instructor matched by name to a `User`.
- Section rows (`sections_schedule`) → `Session(type=SECTION)` (`saveSectionsToDatabase`). `assistant_name`
  resolves to a `TA`; its linked `User` is set as `instructorId` when available. `UNASSIGNED` rows are
  stored with null day/time.

Time strings (`"2:00 PM"` / `"09:00"`) are parsed by `parseTime`. Day names map to the `DayOfWeek` enum.

---

## Section scheduling: two-call approach

The AI section scheduler picks rooms purely from the supplied `rooms` list (prefers "lab"-typed rooms,
else all rooms) — there is no per-course room logic. To place theoretical sections in lecture rooms and
practical sections in labs without changing the AI, the backend calls `/sections/generate` twice:

1. Practical courses + only `LAB` rooms.
2. Theoretical courses + only `LECTURE_HALL` rooms (the "no lab" fallback then uses lecture rooms).

The `sections_schedule` rows from both calls are merged and saved.

---

## scheduleType

`POST /api/v1/schedule/generate` accepts `scheduleType`:

- `lectures`: CP only → save lectures.
- `sections`: CP (for time slots) → save sections only.
- `all` (default): CP + sections under one `Schedule`.

---

## Previously-resolved blockers

- `Department.code` and `Course.year` now exist in the schema (no longer blockers).
- Instructor availability moved to the `InstructorAvailability` model and is now read correctly
  (the old code referenced non-existent `instructor.day/startTime/endTime`).
- The backend now calls `/cp/generate` with `CPConfig` instead of the stale GA `/schedule/generate`.

---

## Known limitations / out of scope

- The AI section scheduler is a greedy, conflict-free assigner and does NOT enforce the detailed TA
  rules in `AI/Sections Instructions.txt` (4-day TA spread, 3h-consecutive / 5h-daily caps,
  >50% supervision). Full compliance is AI-side work.
- `Session` has no dedicated `taId`; the assigned TA is linked via `instructorId` (the TA's `User`) when
  available, otherwise the TA name is retained in the session name. Adding `taId` to `Session` is a
  possible future enhancement (requires a migration).
- Lecture/section instructor name matching is best-effort by name; mismatches leave the session without
  an instructor link.
