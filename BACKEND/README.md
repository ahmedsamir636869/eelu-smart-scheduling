# 🎓 EELU Scheduling System - Backend

> **Node.js/Express REST API** for university course scheduling with AI-powered schedule generation.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [AI Integration](#ai-integration)
- [Project Structure](#project-structure)
- [Testing with Postman](#testing-with-postman)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

This is the backend API for the **EELU Scheduling System**, a comprehensive university course scheduling application that uses **Genetic Algorithms** (via FastAPI microservice) to generate optimized course schedules while avoiding conflicts.

### Key Capabilities:
- 🔐 **Authentication & Authorization** (JWT-based with role management)
- 📧 **Email Verification** (OTP-based with Gmail integration)
- 🏫 **University Data Management** (Campus, Colleges, Departments, Courses, etc.)
- 🤖 **AI-Powered Schedule Generation** (Integration with FastAPI/Python GA service)
- 📊 **Schedule Management** (CRUD operations for generated schedules)

---

## ✨ Features

### 🔐 Authentication System
- User registration with email verification (OTP)
- Login with JWT access & refresh tokens
- Password reset via email OTP
- Role-based access control (ADMIN, INSTRUCTOR, TA)

### 🏛️ University Data Management
- **Campus Management**: Manage university campuses and their locations
- **College Management**: Organize colleges within campuses
- **Department Management**: Departments with unique codes
- **Course Management**: Courses with year, days, hours, and type (THEORETICAL/PRACTICAL)
- **Classroom Management**: Lecture halls and labs with capacity tracking
- **Instructor Management**: Instructor details with availability schedules
- **Student Groups**: Manage student divisions by year and department

### 🤖 AI Schedule Generation
- Integration with FastAPI Genetic Algorithm service
- Automatic data transformation (Backend ↔ AI format)
- Conflict-free schedule generation
- Optimized room allocation and time slots

### 📧 Email System
- Gmail SMTP integration
- OTP verification emails (registration & password reset)
- HTML email templates
- Automatic email retry logic

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js (v18+) |
| **Framework** | Express.js v5 |
| **Database** | PostgreSQL (via Neon) |
| **ORM** | Prisma |
| **Authentication** | JWT (jsonwebtoken) |
| **Validation** | Joi |
| **Email** | Nodemailer (Gmail) |
| **Password Hashing** | bcrypt |
| **HTTP Client** | node-fetch (for AI integration) |
| **Development** | Nodemon |

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL Database** (or Neon account) - [Neon.tech](https://neon.tech/)
- **Git** - [Download](https://git-scm.com/)
- **Gmail Account** with App Password (for email features)

Optional:
- **Postman** - [Download](https://www.postman.com/) (for API testing)
- **AI Service** running on port 8000 (for schedule generation)

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "EELU SYSTEM/BACKEND"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

---

## 🔑 Environment Variables

Create a `.env` file in the `BACKEND` directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# JWT Configuration
# Generate secrets using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Email Configuration (Gmail)
# IMPORTANT: Use App Password, not regular password
# Generate from: https://myaccount.google.com/apppasswords
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AI Service Configuration
AI_API_URL=http://localhost:8000

# CORS Configuration (Optional)
# ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

### 📧 **Setting up Gmail App Password:**

1. Enable **2-Factor Authentication** on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate a new App Password for "Mail"
4. Copy the **16-character password** (e.g., `abcd efgh ijkl mnop`)
5. Remove spaces and paste in `EMAIL_PASS` (e.g., `abcdefghijklmnop`)

---

## 🗄️ Database Setup

### 1. Create Database Migration

```bash
npx prisma migrate dev --name init
```

### 2. (Optional) Reset Database

If you need to clear all data and re-run migrations:

```bash
npx prisma migrate reset --force
```

### 3. View Database in Prisma Studio

```bash
npx prisma studio
```

Opens a GUI at `http://localhost:5555` to view and edit data.

---

## 🚀 Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

Server will start on: `http://localhost:3000`

### Production Mode

```bash
npm start
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| POST | `/auth/refresh` | Refresh access token | ❌ (uses cookie) |
| POST | `/auth/logout` | Logout user | ❌ |
| POST | `/auth/verify-email` | Verify email with OTP | ❌ |
| POST | `/auth/resend-verification-otp` | Resend verification OTP | ❌ |
| POST | `/auth/forgot-password` | Request password reset | ❌ |
| POST | `/auth/verify-otp` | Verify OTP for password reset | ❌ |
| POST | `/auth/reset-password` | Reset password with OTP | ❌ |
| GET | `/auth/me` | Get current user | ✅ |

### 🏫 Campus Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/campus` | Get all campuses | ✅ |
| GET | `/campus/:campusId` | Get campus by ID | ✅ |
| POST | `/campus` | Create campus | ✅ Admin |
| PATCH | `/campus/:campusId` | Update campus | ✅ Admin |
| DELETE | `/campus/:campusId` | Delete campus | ✅ Admin |

### 🏛️ College Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/college/:campusId` | Get colleges by campus | ✅ |
| GET | `/college/single/:collegeId` | Get college by ID | ✅ |
| POST | `/college` | Create college | ✅ Admin |
| PATCH | `/college/:collegeId` | Update college | ✅ Admin |
| DELETE | `/college/:collegeId` | Delete college | ✅ Admin |

### 🎓 Department Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/department/:collegeId` | Get departments by college | ✅ |
| GET | `/department/single/:departmentId` | Get department by ID | ✅ |
| POST | `/department` | Create department | ✅ Admin |
| PATCH | `/department/:departmentId` | Update department | ✅ Admin |
| DELETE | `/department/:departmentId` | Delete department | ✅ Admin |

**Required Fields:**
```json
{
  "name": "Computer Science",
  "code": "CS",              // NEW: Unique department code (uppercase)
  "collegeId": "cm_..."
}
```

### 📚 Course Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/course` | Get all courses | ✅ |
| GET | `/course/:courseId` | Get course by ID | ✅ |
| POST | `/course` | Create course | ✅ Admin |
| PATCH | `/course/:courseId` | Update course | ✅ Admin |
| DELETE | `/course/:courseId` | Delete course | ✅ Admin |

**Required Fields:**
```json
{
  "name": "Software Engineering",
  "code": "SWE101",
  "type": "THEORETICAL",      // or "PRACTICAL"
  "days": 2,
  "hoursPerDay": 2,
  "year": 1,                  // NEW: Student year (1-4)
  "departmentId": "cm_...",
  "collegeId": "cm_...",
  "instructorId": "cm_..."    // Optional
}
```

### 🏫 Classroom Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/classroom/:campusId` | Get classrooms by campus | ✅ |
| GET | `/classroom/single/:classroomId` | Get classroom by ID | ✅ |
| POST | `/classroom` | Create classroom | ✅ Admin |
| PATCH | `/classroom/:classroomId` | Update classroom | ✅ Admin |
| DELETE | `/classroom/:classroomId` | Delete classroom | ✅ Admin |

### 👨‍🏫 Instructor Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/instructor` | Get all instructors | ✅ |
| GET | `/instructor/:instructorId` | Get instructor by ID | ✅ |
| POST | `/instructor` | Create instructor | ✅ Admin |
| PATCH | `/instructor/:instructorId` | Update instructor | ✅ Admin |
| DELETE | `/instructor/:instructorId` | Delete instructor | ✅ Admin |

### 👥 Student Group Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/studentGroup/:departmentId` | Get groups by department | ✅ |
| GET | `/studentGroup/single/:studentGroupId` | Get group by ID | ✅ |
| POST | `/studentGroup` | Create student group | ✅ Admin |
| PATCH | `/studentGroup/:studentGroupId` | Update student group | ✅ Admin |
| DELETE | `/studentGroup/:studentGroupId` | Delete student group | ✅ Admin |

### 📅 Session Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/session` | Get all sessions | ✅ |
| GET | `/session/:sessionId` | Get session by ID | ✅ |
| POST | `/session` | Create session | ✅ Admin |
| PATCH | `/session/:sessionId` | Update session | ✅ Instructor/Admin |
| DELETE | `/session/:sessionId` | Delete session | ✅ Admin |

### 🤖 **AI Schedule Generation**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/schedule/generate` | Generate schedule using AI | ✅ Admin |

**Request:**
```json
{
  "campusId": "cm_campus_id",
  "semester": "Fall 2024"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule generated successfully",
  "schedule": {
    "id": "cm_schedule_id",
    "semester": "Fall 2024",
    "generatedBy": "AI-GA",
    "createdAt": "2024-10-15T10:30:00.000Z",
    "sessions": [...],
    "totalSessions": 106
  }
}
```

---

## 🤖 AI Integration

### Overview

The backend integrates with a **FastAPI microservice** that uses **Genetic Algorithms** to generate optimized schedules.

### Architecture

```
Frontend/Postman
    ↓
Backend (Node.js/Express) - Port 3000
    ↓
    1. Fetch data from PostgreSQL
    2. Transform to AI format
    ↓
AI Service (FastAPI/Python) - Port 8000
    ↓
    3. Run Genetic Algorithm
    4. Generate optimized schedule
    ↓
Backend (Node.js/Express)
    ↓
    5. Save schedule to PostgreSQL
    6. Return response
```

### Data Transformation

**Backend → AI:**
- `Department.code` → `"Department": "CS"`
- `Course.year` → `"Year": 1`
- `Classroom.type` (LECTURE_HALL/LAB) → `"Type": "Lecture"/"Lab"`
- `CourseType` (THEORETICAL/PRACTICAL) → `"Type": "Lecture"/"Lab"`

**AI → Backend:**
- `schedule[]` → `Session[]` in database
- Day names → `DayOfWeek` enum
- Time strings → `DateTime` objects

### Setup

1. **Start AI Service** (separate terminal):
```bash
cd "../AI"
uvicorn src.main:app --port 8000
```

2. **Verify AI is running:**
```
http://localhost:8000/health
```

3. **Test integration:**
```http
POST http://localhost:3000/api/v1/schedule/generate
```

For detailed integration documentation, see: `docs/AI_INTEGRATION_ANALYSIS.md`

---

## 📂 Project Structure

```
BACKEND/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── config/
│   │   └── db.js             # Database connection
│   ├── constants/
│   │   └── status.messages.js # HTTP status codes
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.js
│   │   ├── campus.controller.js
│   │   ├── college.controller.js
│   │   ├── course.controller.js
│   │   ├── department.controller.js
│   │   ├── classroom.controller.js
│   │   ├── instructor.controller.js
│   │   ├── session.controller.js
│   │   ├── studentGroup.controller.js
│   │   ├── schedule.controller.js  # AI integration
│   │   └── user.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js  # JWT & role-based auth
│   ├── routes/               # API routes
│   │   ├── index.routes.js
│   │   ├── auth.routes.js
│   │   ├── campus.routes.js
│   │   ├── college.routes.js
│   │   ├── course.routes.js
│   │   ├── department.routes.js
│   │   ├── classroom.routes.js
│   │   ├── instructor.routes.js
│   │   ├── session.routes.js
│   │   ├── studentGroup.routes.js
│   │   ├── schedule.routes.js   # AI endpoints
│   │   └── user.routes.js
│   ├── services/             # Business logic
│   │   ├── auth.service.js
│   │   ├── ai-integration.service.js  # AI communication
│   │   ├── campus.service.js
│   │   ├── college.service.js
│   │   ├── course.service.js
│   │   ├── department.service.js
│   │   ├── classroom.service.js
│   │   ├── instructor.service.js
│   │   ├── session.service.js
│   │   ├── studentGroup.service.js
│   │   └── user.service.js
│   ├── validators/           # Joi validation schemas
│   ├── utils/
│   │   ├── jwt.js           # JWT utilities
│   │   └── mailer.js        # Email utilities
│   ├── templates/           # Email HTML templates
│   │   ├── email-verification.html
│   │   └── ResetPassword.html
│   └── server.js            # Entry point
├── docs/                    # Documentation
│   ├── AI_INTEGRATION_ANALYSIS.md
│   └── CODE_CLEANUP_SUMMARY.md
├── .env                     # Environment variables
├── .gitignore
├── package.json
└── README.md               # This file
```

---

## 🧪 Testing with Postman

### Test Data Creation Order

Due to foreign key constraints, create data in this order:

1. **Register & Login as Admin**
```http
POST /api/v1/auth/register
{
  "email": "admin@example.com",
  "password": "123456",
  "name": "Admin User",
  "role": "ADMIN"
}
```

2. **Verify Email** (check console for OTP or email)
```http
POST /api/v1/auth/verify-email
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

3. **Login**
```http
POST /api/v1/auth/login
{
  "email": "admin@example.com",
  "password": "123456"
}
```
*Copy the `accessToken` for subsequent requests*

4. **Create Campus**
```http
POST /api/v1/campus
Authorization: Bearer <token>
{
  "name": "Main Campus",
  "city": "Cairo"
}
```

5. **Create College**
```http
POST /api/v1/college
Authorization: Bearer <token>
{
  "name": "Engineering",
  "campusId": "cm_campus_id"
}
```

6. **Create Department**
```http
POST /api/v1/department
Authorization: Bearer <token>
{
  "name": "Computer Science",
  "code": "CS",
  "collegeId": "cm_college_id"
}
```

7. **Create Classroom**
```http
POST /api/v1/classroom
Authorization: Bearer <token>
{
  "name": "Hall A",
  "capacity": 100,
  "type": "LECTURE_HALL",
  "campusId": "cm_campus_id"
}
```

8. **Create Instructor**
```http
POST /api/v1/instructor
Authorization: Bearer <token>
{
  "name": "Dr. Ahmed",
  "departmentId": "cm_department_id",
  "day": "SUNDAY",
  "startTime": "2024-01-01T09:00:00Z",
  "endTime": "2024-01-01T17:00:00Z"
}
```

9. **Create Course**
```http
POST /api/v1/course
Authorization: Bearer <token>
{
  "name": "Software Engineering",
  "code": "SWE101",
  "type": "THEORETICAL",
  "days": 2,
  "hoursPerDay": 2,
  "year": 1,
  "departmentId": "cm_department_id",
  "collegeId": "cm_college_id",
  "instructorId": "cm_instructor_id"
}
```

10. **Create Student Group**
```http
POST /api/v1/studentGroup
Authorization: Bearer <token>
{
  "name": "CS-1-A",
  "departmentId": "cm_department_id",
  "year": 1,
  "studentCount": 50
}
```

11. **Generate Schedule (AI)**
```http
POST /api/v1/schedule/generate
Authorization: Bearer <token>
{
  "campusId": "cm_campus_id",
  "semester": "Fall 2024"
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **"Cannot destructure property 'refreshToken' of 'req.cookies' as it is undefined"**

**Solution:** Install and configure `cookie-parser` middleware.

✅ Already fixed in `src/server.js`:
```javascript
app.use(cookieParser());
```

---

#### 2. **"JWT_SECRET is not defined" / Token errors**

**Solution:** Check `.env` file:
```env
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

#### 3. **Email not sending / "Invalid login: 535-5.7.8 Username and Password not accepted"**

**Solution:** Use Gmail App Password, NOT regular password.

Steps:
1. Enable 2FA on Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use 16-character password in `EMAIL_PASS`

---

#### 4. **Prisma Migration Error: "Cannot add required column without default value"**

**Solution:** Reset database (for development only):
```bash
npx prisma migrate reset --force
```

Or create migration with defaults:
```bash
npx prisma migrate dev --create-only
# Edit migration file to add DEFAULT values
npx prisma migrate dev
```

---

#### 5. **AI Integration: "AI Service Error: ECONNREFUSED"**

**Solution:** Ensure FastAPI service is running on port 8000:
```bash
cd ../AI
uvicorn src.main:app --port 8000
```

Verify: http://localhost:8000/health

---

#### 6. **Foreign Key Constraint Violations**

**Solution:** Create data in the correct order (see Testing section above).

Example error:
```
Foreign key constraint violated on the constraint: `Course_departmentId_fkey`
```

This means you're trying to create a Course with a `departmentId` that doesn't exist. Create the Department first!

---

## 📖 Additional Documentation

- **AI Integration Guide**: `docs/AI_INTEGRATION_ANALYSIS.md`
- **Code Cleanup Summary**: `docs/CODE_CLEANUP_SUMMARY.md`
- **Prisma Schema**: `prisma/schema.prisma`

---

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is part of the EELU Graduation Project - University Course Scheduling System.

---

## 🙏 Acknowledgments

- Built with ❤️ by the EELU Graduation Project Team
- Powered by Genetic Algorithms for optimal schedule generation
- Special thanks to all contributors and testers

---

## 📧 Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review the documentation in `/docs`
- Open an issue on GitHub

---

**Happy Scheduling! 🎓📅**
