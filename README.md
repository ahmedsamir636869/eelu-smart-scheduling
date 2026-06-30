<div align="center">

# 🎓 EELU Smart Scheduling System

**An AI-Powered University Course Scheduling Platform**

*Egyptian E-Learning University — Graduation Project*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)
[![OR-Tools](https://img.shields.io/badge/OR--Tools-CP--SAT-4285F4?style=flat-square&logo=google&logoColor=white)](https://developers.google.com/optimization)

</div>

---

## 📋 Table of Contents

1. [Problem Statement](#1--problem-statement)
2. [Solution](#2--solution)
3. [System Architecture](#3--system-architecture)
4. [Tech Stack](#4--tech-stack)
5. [Features](#5--features)

---

## 1. 🔴 Problem Statement

The **Egyptian E-Learning University (EELU)** operates across **14+ geographically distributed branches** throughout Egypt. Scheduling university courses manually across this network is an exceptionally complex logistical challenge due to the following compounding factors:

### Scale & Heterogeneity
Each branch is operationally independent with its own set of resources:
- **Different room counts** — varying numbers of lecture halls and computer labs per branch
- **Different lab availability** — practical course capacity varies significantly between campuses
- **Different staff pools** — each branch has its own full-time and part-time instructors (Doctors) and Teaching Assistants (TAs)

### Constraint Conflicts
A valid university schedule must simultaneously satisfy a dense set of hard constraints:
- No instructor can be scheduled in two rooms at the same time
- No room can host two different groups at the same time
- No student group can attend two courses at the same time
- Room type must match course type (lecture hall for theory, lab for practical)
- Room capacity must accommodate the student group size
- Part-time instructors are only available on specific days they declare
- Courses must be spread across a defined number of days per week
- All sessions must fall within working hours (08:00 – 17:00)

### Manual Process Failures
Traditional manual scheduling by administrators was:
- **Time-consuming** — taking weeks of coordination per semester
- **Error-prone** — conflicts were common and difficult to detect
- **Non-scalable** — impossible to optimize across 14+ branches simultaneously
- **Rigid** — changes (e.g., an instructor becoming unavailable) required full manual rework

> There was no unified digital system allowing administrators to manage resources, generate conflict-free schedules, and give staff visibility into their own timetables.

---

## 2. ✅ Solution

The EELU Smart Scheduling System is a full-stack, AI-driven platform that automates the end-to-end scheduling process for all university branches through a single centralized interface.

### Core Approach
The system transforms scheduling into a **Constraint Satisfaction Problem (CSP)** and solves it using **Google OR-Tools CP-SAT**, a state-of-the-art Constraint Programming solver. The AI engine finds a provably valid assignment of `(course, group, day, room, time)` tuples that satisfies all hard constraints.

### Algorithm Evolution
The CP-SAT solver is the **third and final algorithm** after two earlier research trials:

| Trial | Algorithm | Outcome |
|-------|-----------|---------|
| 1st | **Genetic Algorithm (GA)** | Explored but struggled with hard constraint guarantees at scale |
| 2nd | **Integer Linear Programming (ILP)** | Mathematically sound but computationally expensive at scale |
| 3rd ✅ | **Constraint Programming (CP-SAT)** | Adopted — fast, exact, and supports automatic constraint relaxation |

### Two-Phase Scheduling
The AI engine operates in two coordinated phases:
1. **Lecture Scheduling** — Assigns each course's lecture sessions to rooms and time slots using the CP-SAT solver
2. **Section Scheduling** — Assigns lab/practical sections for TAs, building on the lecture schedule without introducing new conflicts

### Platform Solution
Beyond the algorithm, the platform provides:
- A **web dashboard** for admins to manage all university data and trigger schedule generation per campus
- **Role-based access** so Doctors and TAs see only what is relevant to them
- A **reporting system** for TAs to flag schedule conflicts
- An **availability system** for part-time instructors to declare their working days

---

## 3. 🏗️ System Architecture

The system follows a **microservices architecture** with three decoupled services communicating over HTTP.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              FRONTEND  (Next.js / TypeScript)            │   │
│   │                                                         │   │
│   │   Admin Dashboard  │  Doctor View  │  TA View           │   │
│   └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │  REST API  (JWT Auth)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND  (Node.js / Express.js)               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Auth & RBAC │  │  University  │  │  Schedule & Session   │   │
│  │  (JWT + OTP) │  │  Data CRUD   │  │  Management           │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Prisma ORM  →  PostgreSQL                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                               │                                  │
│            Data transform (Backend ↔ AI format)                  │
│                               │  Internal HTTP (port 8000)       │
└───────────────────────────────┼──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      AI SERVICE  (FastAPI / Python)              │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              CP-SAT Solver  (Google OR-Tools)            │   │
│   │                                                         │   │
│   │  Phase 1: Lecture Scheduler  →  SchedulingCP            │   │
│   │  Phase 2: Section Scheduler  →  SectionScheduler        │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow — Schedule Generation

```
Admin triggers generation
        │
        ▼
Backend fetches campus data from PostgreSQL
        │
        ▼
Backend transforms data to AI format
  (rooms, courses, doctors, divisions)
        │
        ▼
POST /schedule/generate  →  FastAPI AI Service
        │
        ▼
CP-SAT Phase 1: Solve lecture assignments
        │
        ▼
CP-SAT Phase 2: Assign lab sections to TAs
        │
        ▼
AI returns combined schedule JSON
        │
        ▼
Backend maps AI output → Session records in DB
        │
        ▼
Schedule saved as DRAFT — Admin reviews
        │
        ▼
Admin PUBLISHES → Doctors & TAs view timetables
```

### Database Entity Overview

The relational schema (PostgreSQL + Prisma) models the full university hierarchy:

```
Campus
  └── College
        └── Department
              ├── Course  ──────────────────── Session ──── Schedule
              │     ├── Instructor (Doctor)        │
              │     └── TA                         └── Classroom
              ├── StudentGroup
              ├── Instructor
              │     └── InstructorAvailability
              └── TA
                    ├── TAOffDay
                    └── TAReport
```

---

## 4. 🛠️ Tech Stack

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 14** (App Router) | SSR/CSR hybrid rendering |
| Language | **TypeScript** | Type-safe development |
| Styling | **Tailwind CSS** | Utility-first responsive design |
| State / Routing | **Next.js App Router** | File-based routing and layouts |

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | **Node.js 18+** | JavaScript server runtime |
| Framework | **Express.js v5** | REST API routing |
| Database | **PostgreSQL** | Relational data persistence |
| ORM | **Prisma** | Type-safe database access & migrations |
| Auth | **JWT** (Access + Refresh tokens) | Stateless authentication |
| Validation | **Joi** | Request schema validation |
| Email | **Nodemailer** (Gmail SMTP) | OTP delivery |
| Password | **bcrypt** | Secure password hashing |
| Container | **Docker** | Containerized deployment |

### AI Service

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **FastAPI** | High-performance async Python API |
| Language | **Python 3.10+** | Algorithm implementation |
| Solver | **Google OR-Tools CP-SAT** | Constraint Programming solver |
| Data Processing | **Pandas / NumPy** | Data loading and transformation |
| Validation | **Pydantic v2** | Request/response schema validation |
| Server | **Uvicorn** | ASGI production server |

---

## 5. ✨ Features

### 🔐 Authentication & Role-Based Authorization

Three distinct user roles with strictly enforced permissions:

| Capability | Admin | Doctor (Instructor) | TA |
|-----------|:-----:|:-------------------:|:--:|
| Manage university data | ✅ | ❌ | ❌ |
| Generate schedules | ✅ | ❌ | ❌ |
| Publish / archive schedules | ✅ | ❌ | ❌ |
| View published schedules | ✅ | ✅ | ✅ |
| Declare part-time availability | ❌ | ✅ | ❌ |
| Submit schedule conflict reports | ❌ | ❌ | ✅ |

- **JWT-based auth** with short-lived access tokens and secure refresh token rotation via HTTP-only cookies
- **OTP email verification** on registration and password reset
- **Approval workflow** for instructor availability requests (`PENDING → APPROVED / REJECTED`)

### 🏫 University Data Management (Admin Only)

Full CRUD management for the complete university hierarchy — scoped per campus:

- **Campus Management** — Create and manage all 14+ branches individually
- **College Management** — Organize faculties within each campus
- **Department Management** — Departments with unique codes (e.g., `CS`, `IT`, `IS`)
- **Course Management** — Courses with type (Theoretical/Practical), academic year, weekly frequency, and hours per day
- **Classroom Management** — Lecture halls and computer labs with capacity and type tracking per campus
- **Instructor Management** — Doctor profiles, employment type (full-time / part-time), and availability schedules
- **TA Management** — Teaching assistant profiles linked to departments and courses
- **Student Group Management** — Student divisions organized by academic year and department

### 🤖 AI-Powered Schedule Generation

- Admin selects a **campus** and **semester**, triggers generation in one click
- Backend **automatically collects and transforms** all relevant campus data (rooms, courses, instructors, divisions) into the solver's format
- **CP-SAT solver** runs with a configurable time limit (default: 5 minutes) and performs **automatic constraint relaxation** if the problem is initially infeasible
- Returns a **combined lecture + lab section schedule** covering all student groups

**Hard Constraints enforced by the CP-SAT solver:**
- ✅ No room double-booking (same room, same day, overlapping times)
- ✅ No instructor double-booking (same instructor, same day, overlapping times)
- ✅ No student group overlap (same division, two concurrent classes)
- ✅ Room type matching — Lecture Hall for Theoretical courses, Lab for Practical courses
- ✅ Room capacity validation against student group size (half-group splitting for sections)
- ✅ Instructor availability windows enforced (critical for part-time doctors)
- ✅ All sessions bounded within working hours (08:00 – 17:00)
- ✅ Configurable maximum active teaching days per academic year level

### 📅 Schedule Workflow

- **DRAFT → PUBLISHED** — schedules are generated as drafts and must be explicitly published by the admin
- **Per-campus scoping** — each branch manages its own independent schedule
- **Session-level records** — each session stores day, start/end time, classroom, instructor, course, and student count
- **Semester-aware** — multiple schedules can coexist for different academic semesters

### 👨‍⚕️ Doctor (Instructor) Portal

- View **published timetables** filtered to their assigned courses
- Submit **working day availability** declarations for part-time arrangements
- Track the status of submitted availability requests

### 🧑‍💻 TA Portal

- View **published schedules** including their assigned lab sections
- Submit **TAReports** to flag issues with the generated schedule (e.g., resource conflicts, errors)
- Declare **off days** that the section scheduler respects when assigning lab sessions

### 📧 Email System

- HTML-templated OTP emails for account verification and password reset
- Gmail SMTP integration using App Password authentication
- Retry logic for transient delivery failures

### 🔧 Developer & Operations

- **Docker support** — backend ships with a `Dockerfile` and `docker-compose.yml` for containerized deployment
- **Prisma migrations** — version-controlled schema evolution with rollback support
- **Prisma Studio** — built-in database GUI (`npx prisma studio`)
- **FastAPI interactive docs** — auto-generated Swagger UI at `http://localhost:8000/docs`
- **Jest test suite** — unit and integration tests for the backend API layer
- **Joi validation** on all incoming API requests with descriptive error responses
- **Standardized error handling** with consistent response format across all endpoints

---

<div align="center">

Built with ❤️ by the EELU Graduation Project Team

*Egyptian E-Learning University — Information Technology Department*

</div>
