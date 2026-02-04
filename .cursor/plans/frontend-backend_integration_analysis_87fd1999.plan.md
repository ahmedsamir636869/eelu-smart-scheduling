---
name: Frontend-Backend Integration Analysis
overview: Analyze the gaps between frontend and backend to identify missing API integrations, data structure mismatches, authentication requirements, and missing endpoints.
todos: []
---

# Frontend-Backend Integratio

n Analysis

## Critical Issues Found

### 1. API Configuration Mismatches

**Problem:**

- Frontend API base URL: `http://localhost:3001/api` ([FRONTEND/lib/api.ts](FRONTEND/lib/api.ts))
- Backend server runs on: `http://localhost:3000` ([BACKEND/src/server.js](BACKEND/src/server.js))
- Backend API prefix: `/api/v1` ([BACKEND/src/server.js](BACKEND/src/server.js))

**Solution:** Update frontend API base URL to `http://localhost:3000/api/v1`

### 2. Authentication System Missing

**Backend Requirements:**

- All protected routes require `Authorization: Bearer <token>` header ([BACKEND/src/middleware/auth.middleware.js](BACKEND/src/middleware/auth.middleware.js))
- Login returns `accessToken` and sets `refreshToken` cookie ([BACKEND/src/controllers/auth.controller.js](BACKEND/src/controllers/auth.controller.js))
- Token refresh endpoint: `POST /api/v1/auth/refresh` (uses cookie)

**Frontend Status:**

- No authentication implementation
- No token storage (localStorage/sessionStorage)
- No token injection in API requests
- No login/logout pages
- No protected route guards

**Missing:**

- Auth context/provider for token management
- Login page component
- Token storage utilities
- Automatic token refresh mechanism
- Protected route wrapper component

### 3. Data Structure Mismatches

#### Campus/Branch Structure

- **Frontend expects:** `{ id: string, name: string, status: 'draft' | 'published' | 'pending_review' }` ([FRONTEND/types/api.ts](FRONTEND/types/api.ts))
- **Backend returns:** `{ id: string, name: string, city: string, colleges: College[] }` ([BACKEND/prisma/schema.prisma](BACKEND/prisma/schema.prisma))
- **Issue:** Backend doesn't have `status` field

#### Classroom/Physical Resources

- **Frontend expects:** `{ id: string, name: string, type: 'lab' | 'room', capacity: number }` ([FRONTEND/types/api.ts](FRONTEND/types/api.ts))
- **Backend expects:** `{ name: string, capacity: number, type: 'LAB' | 'LECTURE_HALL', campusName: string }` ([BACKEND/src/validators/classroom.validator.js](BACKEND/src/validators/classroom.validator.js))
- **Issues:** 
- Type values differ (`lab` vs `LAB`, `room` vs `LECTURE_HALL`)
- Backend requires `campusName` instead of `campusId`
- Backend returns nested response: `{ message: string, classroom: {...} }`

#### Instructor Structure

- **Frontend expects:** `{ id: string, name: string, staffId: string, ... }` (from components)
- **Backend expects:** `{ name: string, departmentId: string, day: DayOfWeek, startTime: DateTime, endTime: DateTime }` ([BACKEND/src/controllers/instructor.controller.js](BACKEND/src/controllers/instructor.controller.js))
- **Issue:** Frontend uses `staffId` but backend doesn't have this field

### 4. API Response Format Mismatches

**Backend Response Format:**

```javascript
{
  message: "Success message",
  campus: { ... } // or campuses: [...]
}
```

**Frontend Expects:**

- Direct data objects or arrays
- No wrapper objects

**Solution:** Create response transformers in API client

### 5. Missing API Endpoints

#### Dashboard Metrics

- **Frontend needs:** Dashboard metrics (pending reviews, conflicts, uploaded schedules)
- **Backend:** No endpoint exists
- **Required:** `GET /api/v1/dashboard/metrics`

#### Reports

- **Frontend needs:** TA reports list and details
- **Backend:** No reports endpoint exists
- **Required:** `GET /api/v1/reports`, `GET /api/v1/reports/:reportId`

#### Published Schedules

- **Frontend needs:** Published schedules by branch/faculty
- **Backend:** Only has schedule generation, no published schedules endpoint
- **Required:** `GET /api/v1/schedule/published`, `GET /api/v1/schedule/published/:campusId`

#### Bulk Import

- **Frontend needs:** File upload endpoints for bulk import
- **Backend:** No file upload endpoints
- **Required:** `POST /api/v1/import/students`, `POST /api/v1/import/instructors`, etc.

#### Doctor Schedules Upload

- **Frontend needs:** PDF upload for doctor schedules
- **Backend:** No file upload endpoint
- **Required:** `POST /api/v1/schedule/upload-doctor-schedule`

### 6. Missing API Integrations in Frontend

All frontend pages use mock data. Need to integrate:

- **Dashboard:** Fetch metrics from API
- **Data Management:** 
- Fetch campuses: `GET /api/v1/campus`
- Create campus: `POST /api/v1/campus`
- Update campus: `PATCH /api/v1/campus/:campusId`
- **Physical Resources:**
- Fetch classrooms: `GET /api/v1/classroom?campusName=...`
- Create classroom: `POST /api/v1/classroom`
- Update classroom: `PATCH /api/v1/classroom/:classroomId`
- **Instructors:**
- Fetch instructors: `GET /api/v1/instructor`
- Create instructor: `POST /api/v1/instructor`
- Update instructor: `PUT /api/v1/instructor/:instructorId`
- **Students:**
- Fetch student groups: `GET /api/v1/studentGroup`
- Create/update student groups
- **Generate Schedule:**
- Generate schedule: `POST /api/v1/schedule/generate`

### 7. Error Handling

**Current State:**

- Frontend API client throws generic errors ([FRONTEND/lib/api.ts](FRONTEND/lib/api.ts))
- No error handling in components
- No user-friendly error messages

**Required:**

- Proper error parsing from backend responses
- Error toast/notification system
- Retry logic for failed requests
- 401 handling (redirect to login)

### 8. Query Parameter Handling

**Backend Classroom Endpoint:**

- `GET /api/v1/classroom?campusName=...` expects query parameter ([BACKEND/src/controllers/classroom.controller.js](BACKEND/src/controllers/classroom.controller.js))
- Frontend needs to pass `campusName` instead of `campusId`

### 9. CORS Configuration

**Current:** Backend CORS configured for `http://localhost:3001` ([BACKEND/src/server.js](BACKEND/src/server.js))**Frontend runs on:** Different port (likely 3001)**Status:** May need verification/adjustment

## Integration Priority

### Phase 1: Critical Infrastructure

1. Fix API base URL
2. Implement authentication system
3. Add token management
4. Create protected route wrapper

### Phase 2: Core Data Management

1. Integrate Campus/Branch CRUD
2. Integrate Classroom/Physical Resources CRUD
3. Integrate Instructor CRUD
4. Integrate Student Groups CRUD

### Phase 3: Advanced Features

1. Schedule generation integration
2. Dashboard metrics (if backend endpoint exists)
3. Reports system (if backend endpoint exists)
4. File upload functionality

### Phase 4: Missing Backend Endpoints

1. Create dashboard metrics endpoint
2. Create reports endpoints
3. Create published schedules endpoints
4. Create bulk import endpoints

## Files to Create/Modify

### Frontend Files to Create:

- `FRONTEND/lib/auth.ts` - Authentication utilities
- `FRONTEND/contexts/AuthContext.tsx` - Auth context provider
- `FRONTEND/app/login/page.tsx` - Login page
- `FRONTEND/components/auth/ProtectedRoute.tsx` - Route protection
- `FRONTEND/lib/api-helpers.ts` - Response transformers

### Frontend Files to Modify:

- `FRONTEND/lib/api.ts` - Add auth headers, error handling
- `FRONTEND/types/api.ts` - Align with backend schemas
- All page components - Replace mock data with API calls

### Backend Files to Create:

- Dashboard metrics controller/service