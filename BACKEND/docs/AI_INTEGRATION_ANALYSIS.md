# 🤖 AI-Backend Integration Analysis

## 📊 **Current State Analysis**

### ✅ **What's Already Compatible:**

| Component | Backend (Prisma) | AI API | Status |
|-----------|-----------------|--------|---------|
| **Courses** | ✅ Course model | ✅ courses array | **Compatible** |
| **Instructors** | ✅ Instructor model | ✅ doctors array | **Compatible** |
| **Rooms** | ✅ Classroom model | ✅ rooms array | **Compatible** |
| **Student Groups** | ✅ StudentGroup model | ✅ divisions array | **Compatible** |
| **Schedule Output** | ✅ Schedule + Session models | ✅ schedule array | **Compatible** |

---

## 🔄 **Data Mapping (Backend → AI)**

### **1. Rooms (Classroom → rooms)**

**Backend (Prisma):**
```typescript
{
  id: "cm123...",             // CUID
  name: "Hall A",
  capacity: 100,
  type: "LECTURE_HALL",       // LECTURE_HALL or LAB
  campusId: "cm456..."
}
```

**AI API Expects:**
```json
{
  "Room_ID": "cm123...",      // ✅ Use Prisma id
  "Room": "Hall A",           // ✅ Use name
  "Capacity": 100,            // ✅ Direct match
  "Type": "Lecture"           // ⚠️ Transform: LECTURE_HALL → "Lecture", LAB → "Lab"
}
```

**Transformation Function:**
```javascript
function transformClassroomToRoom(classroom) {
  return {
    Room_ID: classroom.id,
    Room: classroom.name,
    Capacity: classroom.capacity,
    Type: classroom.type === 'LECTURE_HALL' ? 'Lecture' : 'Lab'
  };
}
```

---

### **2. Courses (Course → courses)**

**Backend (Prisma):**
```typescript
{
  id: "cm789...",
  name: "Introduction to Programming",
  code: "CS101",               // Unique
  type: "THEORETICAL",         // THEORETICAL or PRACTICAL
  days: 2,                     // ✅ Matches!
  hoursPerDay: 2,              // ✅ Matches (Hours_per_day)!
  departmentId: "cm111...",
  collegeId: "cm222...",
  instructorId: "cm333..."     // ✅ Can be null
}
```

**AI API Expects:**
```json
{
  "Course_ID": "cs101",        // ⚠️ Use code (lowercase) or id?
  "Course_Name": "Introduction to Programming",
  "Department": "CS",          // ⚠️ Need department.name or code
  "Major": "CS",               // ⚠️ Same as Department (or could be different)
  "Days": 2,                   // ✅ Direct match
  "Hours_per_day": 2,          // ✅ Matches hoursPerDay
  "Instructor_ID": "cm333...", // ✅ Use instructorId
  "Year": 1,                   // ❌ NOT in Course model!
  "Type": "Lecture"            // ⚠️ Transform: THEORETICAL → "Lecture", PRACTICAL → "Lab"
}
```

**⚠️ Issues Found:**
1. **Year**: AI expects `Year` (student year 1-4), but it's NOT in Course model!
   - **Solution**: Year is in `StudentGroup` model instead. Need to handle this differently.

**Transformation Function:**
```javascript
async function transformCourseToAI(course) {
  // Fetch department to get name
  const department = await prisma.department.findUnique({
    where: { id: course.departmentId }
  });
  
  return {
    Course_ID: course.code.toLowerCase(),  // Or use course.id
    Course_Name: course.name,
    Department: department.name,           // Or create a department.code field
    Major: department.name,                // Same as department for now
    Days: course.days,
    Hours_per_day: course.hoursPerDay,
    Instructor_ID: course.instructorId || null,
    Year: 1,  // ❌ PROBLEM: Need to get this from StudentGroup!
    Type: course.type === 'THEORETICAL' ? 'Lecture' : 'Lab'
  };
}
```

---

### **3. Instructors (Instructor → doctors)**

**Backend (Prisma):**
```typescript
{
  id: "cm444...",
  name: "Dr. Ahmed",
  departmentId: "cm111...",
  day: "SUNDAY",           // Optional, enum DayOfWeek
  startTime: DateTime,     // Optional
  endTime: DateTime        // Optional
}
```

**AI API Expects:**
```json
{
  "Instructor_ID": "cm444...",
  "Instructor_Name": "Dr. Ahmed",
  "Department": "CS",              // ⚠️ Need department name
  "Day": "Sunday",                 // ⚠️ Transform: SUNDAY → "Sunday"
  "Start_Time": "09:00",           // ⚠️ Extract time from DateTime
  "End_Time": "17:00"              // ⚠️ Extract time from DateTime
}
```

**Transformation Function:**
```javascript
async function transformInstructorToDoctor(instructor) {
  const department = await prisma.department.findUnique({
    where: { id: instructor.departmentId }
  });
  
  // Transform day enum to proper case
  const dayMap = {
    'SATURDAY': 'Saturday',
    'SUNDAY': 'Sunday',
    'MONDAY': 'Monday',
    'TUESDAY': 'Tuesday',
    'WEDNESDAY': 'Wednesday',
    'THURSDAY': 'Thursday'
  };
  
  // Extract time from DateTime (assumes DateTime is stored as time only)
  const startTime = instructor.startTime 
    ? new Date(instructor.startTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })
    : '09:00';
  
  const endTime = instructor.endTime
    ? new Date(instructor.endTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })
    : '17:00';
  
  return {
    Instructor_ID: instructor.id,
    Instructor_Name: instructor.name,
    Department: department.name,
    Day: instructor.day ? dayMap[instructor.day] : 'Sunday',
    Start_Time: startTime,
    End_Time: endTime
  };
}
```

---

### **4. Student Groups (StudentGroup → divisions)**

**Backend (Prisma):**
```typescript
{
  id: "cm555...",
  name: "CS-1-A",
  departmentId: "cm111...",
  year: 1,                    // ✅ Matches!
  studentCount: 50            // ✅ Matches!
}
```

**AI API Expects:**
```json
{
  "Num_ID": "DIV1",           // ⚠️ Use id or name?
  "Department": "CS",         // ⚠️ Need department name
  "Major": "CS",              // ⚠️ Same as Department
  "Year": 1,                  // ✅ Direct match
  "StudentNum": 50            // ✅ Matches studentCount
}
```

**Transformation Function:**
```javascript
async function transformStudentGroupToDivision(group) {
  const department = await prisma.department.findUnique({
    where: { id: group.departmentId }
  });
  
  return {
    Num_ID: group.name,        // Or use group.id
    Department: department.name,
    Major: department.name,    // Same for now
    Year: group.year,
    StudentNum: group.studentCount
  };
}
```

---

## 🔄 **Data Mapping (AI → Backend)**

### **Schedule Output**

**AI Returns:**
```json
{
  "success": true,
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

**Backend Needs (Session model):**
```typescript
{
  name: string,              // course_name
  type: SessionType,         // LECTURE or SECTION
  day: DayOfWeek,           // Transform: "Monday" → MONDAY
  startTime: DateTime,       // Parse "2:00 PM"
  endTime: DateTime,         // Parse "3:00 PM"
  studentCount: number,      // students
  courseId: string,          // ⚠️ Need to find by course_name
  instructorId: string,      // ⚠️ Need to find by instructor_name
  classroomId: string,       // ⚠️ Need to find by room
  scheduleId: string         // Parent schedule ID
}
```

**Transformation Function:**
```javascript
async function saveScheduleToDatabase(aiSchedule, scheduleId) {
  const sessions = [];
  
  for (const item of aiSchedule.schedule) {
    // Find course by name
    const course = await prisma.course.findFirst({
      where: { name: { contains: item.course_name.split(' (')[0] } }
    });
    
    // Find instructor by name
    const instructor = await prisma.instructor.findFirst({
      where: { name: item.instructor_name }
    });
    
    // Find classroom by name
    const classroom = await prisma.classroom.findFirst({
      where: { name: item.room }
    });
    
    // Transform day
    const dayMap = {
      'Saturday': 'SATURDAY',
      'Sunday': 'SUNDAY',
      'Monday': 'MONDAY',
      'Tuesday': 'TUESDAY',
      'Wednesday': 'WEDNESDAY',
      'Thursday': 'THURSDAY'
    };
    
    // Parse time (simplified - needs proper implementation)
    const startTime = parseTime(item.start_time);
    const endTime = parseTime(item.end_time);
    
    const session = await prisma.session.create({
      data: {
        name: item.course_name,
        type: 'LECTURE',  // Or determine from course type
        day: dayMap[item.day],
        startTime: startTime,
        endTime: endTime,
        studentCount: item.students,
        courseId: course?.id,
        instructorId: instructor?.id,
        classroomId: classroom?.id,
        scheduleId: scheduleId
      }
    });
    
    sessions.push(session);
  }
  
  return sessions;
}

function parseTime(timeString) {
  // Parse "2:00 PM" to DateTime
  // Implementation needed
  const [time, period] = timeString.split(' ');
  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);
  
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  const date = new Date();
  date.setHours(hour, parseInt(minutes), 0, 0);
  return date;
}
```

---

## ❌ **Critical Issues Found**

### **1. Course → Year Problem**
- **AI expects**: `Year` field in courses (student year 1-4)
- **Backend has**: `Year` is in `StudentGroup`, NOT in `Course`
- **Solution Options**:
  - A) Add `year` field to Course model
  - B) Generate courses x studentGroups combinations (one course per year)
  - C) Modify AI to not require Year in courses

**Recommended**: **Option B** - When generating schedule, duplicate courses for each student group year.

---

### **2. Department Name/Code**
- **AI expects**: Department as string (e.g., "CS")
- **Backend has**: Department has `name` field but may be long ("Computer Science")
- **Solution**: Add `code` field to Department model (e.g., "CS")

---

### **3. Time Storage**
- **Instructor availability**: Backend stores `DateTime` but AI expects time only ("09:00")
- **Solution**: Extract time component when transforming

---

### **4. Finding Records After AI Response**
- AI returns string names, but we need IDs for foreign keys
- **Solution**: Use `findFirst` with name matching (shown in transformation above)
- **Risk**: Name matching may fail if names don't match exactly

---

## 🛠️ **Implementation Plan**

### **Phase 1: Schema Updates** ⚠️ **Required Before Integration**

```prisma
model Department {
  // ... existing fields
  code String @unique  // ADD THIS: "CS", "IT", etc.
}

// Option A (if we go with this approach):
model Course {
  // ... existing fields
  year Int?  // ADD THIS: Student year (1-4), optional
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_department_code_and_course_year
```

---

### **Phase 2: Create Integration Service**

Create: `/BACKEND/src/services/ai-integration.service.js`

```javascript
const fetch = require('node-fetch');  // Or use native fetch in Node 18+
const { prisma } = require('../config/db');

class AIIntegrationService {
  constructor() {
    this.aiApiUrl = process.env.AI_API_URL || 'http://localhost:8000';
  }

  async generateSchedule(campusId, semester) {
    // 1. Fetch all data from database
    const rooms = await this.fetchRooms(campusId);
    const courses = await this.fetchCourses();
    const instructors = await this.fetchInstructors();
    const divisions = await this.fetchDivisions();
    
    // 2. Transform to AI format
    const aiData = {
      data: {
        rooms: rooms.map(transformClassroomToRoom),
        courses: await Promise.all(courses.map(transformCourseToAI)),
        doctors: await Promise.all(instructors.map(transformInstructorToDoctor)),
        divisions: await Promise.all(divisions.map(transformStudentGroupToDivision))
      },
      config: {
        population_size: 50,
        generations: 100,
        mutation_rate: 0.15,
        crossover_rate: 0.8
      }
    };
    
    // 3. Call AI API
    const response = await fetch(`${this.aiApiUrl}/schedule/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiData)
    });
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // 4. Save to database
    const schedule = await this.saveSchedule(result, semester);
    
    return schedule;
  }
  
  async fetchRooms(campusId) {
    return prisma.classroom.findMany({
      where: { campusId }
    });
  }
  
  async fetchCourses() {
    return prisma.course.findMany({
      include: {
        department: true,
        college: true
      }
    });
  }
  
  async fetchInstructors() {
    return prisma.instructor.findMany({
      include: {
        department: true
      }
    });
  }
  
  async fetchDivisions() {
    return prisma.studentGroup.findMany({
      include: {
        department: true
      }
    });
  }
  
  async saveSchedule(aiResult, semester) {
    // Create Schedule record
    const schedule = await prisma.schedule.create({
      data: {
        semester: semester,
        generatedBy: 'AI-GA',  // Or use actual user ID
      }
    });
    
    // Create Session records
    const sessions = await saveScheduleToDatabase(aiResult, schedule.id);
    
    return {
      ...schedule,
      sessions
    };
  }
}

module.exports = { AIIntegrationService };
```

---

### **Phase 3: Create Controller & Route**

Create: `/BACKEND/src/controllers/schedule.controller.js`

```javascript
const { AIIntegrationService } = require('../services/ai-integration.service');

const aiService = new AIIntegrationService();

async function generateScheduleController(req, res) {
  try {
    const { campusId, semester } = req.body;
    
    if (!campusId || !semester) {
      return res.status(400).json({
        message: 'campusId and semester are required'
      });
    }
    
    const schedule = await aiService.generateSchedule(campusId, semester);
    
    return res.status(201).json({
      message: 'Schedule generated successfully',
      schedule
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to generate schedule',
      error: error.message
    });
  }
}

module.exports = { generateScheduleController };
```

Create: `/BACKEND/src/routes/schedule.routes.js`

```javascript
const express = require('express');
const { generateScheduleController } = require('../controllers/schedule.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/generate', isAuthenticated, isAdmin, generateScheduleController);

module.exports = router;
```

Update: `/BACKEND/src/routes/index.routes.js`

```javascript
const scheduleRoutes = require('./schedule.routes');

// ... existing routes
router.use('/schedule', scheduleRoutes);
```

---

### **Phase 4: Environment Setup**

Update `/BACKEND/.env`:

```env
# AI Service
AI_API_URL=http://localhost:8000
```

---

## ✅ **Testing Plan**

### **1. Test AI API Independently**
```bash
cd AI
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

Visit: http://localhost:8000/docs

### **2. Test Integration**

**Request:**
```http
POST http://localhost:3000/api/v1/schedule/generate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "campusId": "cm_xxx",
  "semester": "Fall 2024"
}
```

**Expected Response:**
```json
{
  "message": "Schedule generated successfully",
  "schedule": {
    "id": "cm_yyy",
    "semester": "Fall 2024",
    "generatedBy": "AI-GA",
    "sessions": [...]
  }
}
```

---

## 📋 **Checklist**

### **Before Integration:**
- [ ] Add `code` field to Department model
- [ ] Decide: Add `year` to Course OR handle course x studentGroup combinations
- [ ] Run migration
- [ ] Seed database with test data (Campus, College, Department, etc.)
- [ ] Verify AI service is running

### **During Integration:**
- [ ] Create transformation functions
- [ ] Create AIIntegrationService
- [ ] Create controller & routes
- [ ] Add AI_API_URL to .env
- [ ] Test each transformation independently
- [ ] Test full integration

### **After Integration:**
- [ ] Add error handling
- [ ] Add logging
- [ ] Add validation
- [ ] Test with real data
- [ ] Performance testing

---

## 🚨 **Current State: NOT READY**

### **Blockers:**
1. ❌ Department needs `code` field
2. ❌ Course-Year relationship unclear (need to resolve)
3. ❌ Time parsing functions not implemented
4. ❌ Name-matching logic needs refinement

### **Estimated Time to Ready:**
- Schema fixes: **30 minutes**
- Transformation functions: **2 hours**
- Integration service: **3 hours**
- Testing & debugging: **4 hours**

**Total: ~1 day of work**

---

## 💡 **Recommendations**

1. **Start with Schema Updates**: Add `code` to Department first.
2. **Decision Needed**: How to handle Course Year? (Ask stakeholders)
3. **Incremental Testing**: Test transformations before full integration.
4. **Mock AI API**: Create mock endpoint first for faster development.
5. **Add Validation**: Validate AI response before saving to DB.

**Ready to start implementation?** 🚀
