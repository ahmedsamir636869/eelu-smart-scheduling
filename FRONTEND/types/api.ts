// Branch/Campus types (aligned with backend Prisma schema)
export interface Branch {
  id: string
  name: string
  city: string
  colleges?: College[]
  collegeCount?: number
}

export interface College {
  id: string
  name: string
  campusId?: string
  departments?: Department[]
}

export interface Department {
  id: string
  name: string
  code: string
  collegeId: string
}

// Dashboard types
export interface DashboardMetrics {
  schedulesPendingReviews: number
  openConflictsReports: number
  doctorSchedulesUploaded: string
}

export interface TAReport {
  id: string
  userId: string
  branch: string
  description: string
  status: 'new' | 'in_progress' | 'resolved'
}

// Generate Schedule types
export interface ScheduleGeneration {
  branchId: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  log: string[]
}

export interface PerformanceMetrics {
  initialConflictRate: string
  avgResolutionTime: string
  lastSuccessfulRun: string
}

// Physical Resources types (aligned with backend Prisma schema)
export interface PhysicalResource {
  id: string
  name: string
  type: 'LAB' | 'LECTURE_HALL'
  capacity: number
  campusId: string
}

export interface Instructor {
  id: string
  name: string
  departmentId: string
  day?: 'SATURDAY' | 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
  startTime?: string
  endTime?: string
}

export interface Course {
  id: string
  name: string
  code: string
  type: 'THEORETICAL' | 'PRACTICAL'
  days: number
  hoursPerDay: number
  year: number
  instructorId?: string
  departmentId: string
  collegeId: string
}

export interface StudentGroup {
  id: string
  name: string
  departmentId: string
  year: number
  studentCount: number
}

export interface Schedule {
  id: string
  semester: string
  generatedBy: string
  createdAt: string
  sessions?: Session[]
}

export interface Session {
  id: string
  name: string
  type: 'LECTURE' | 'SECTION'
  day?: 'SATURDAY' | 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
  startTime?: string
  endTime?: string
  studentCount: number
  courseId: string
  instructorId?: string
  classroomId?: string
  scheduleId?: string
}

export interface BranchPhysicalResources {
  branchId: string
  totalCapacity: number
  activeLabs: number
  lectureRooms: number
  resources: PhysicalResource[]
}

