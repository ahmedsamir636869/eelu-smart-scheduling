// Branch types
export interface Branch {
  id: string
  name: string
  status: 'draft' | 'published' | 'pending_review'
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

// Physical Resources types
export interface PhysicalResource {
  id: string
  name: string
  type: 'lab' | 'room'
  capacity: number
}

export interface BranchPhysicalResources {
  branchId: string
  totalCapacity: number
  activeLabs: number
  lectureRooms: number
  resources: PhysicalResource[]
}

