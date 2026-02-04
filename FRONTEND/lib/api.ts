import { getAccessToken, removeAccessToken, isTokenExpired } from './auth'
import { extractData, extractErrorMessage } from './api-helpers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  requireAuth?: boolean
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body, requireAuth = true } = options

  // Add authentication header if required
  const authHeaders: Record<string, string> = { ...headers }
  if (requireAuth) {
    const token = getAccessToken()
    if (token) {
      // Check if token is expired (but don't refresh if this is already a refresh request)
      if (isTokenExpired(token) && !endpoint.includes('/auth/refresh')) {
        // Try to refresh token
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // Include cookies for refresh token
            headers: {
              'Content-Type': 'application/json',
            },
          })
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            const newToken = extractData<{ accessToken: string }>(refreshData).accessToken
            if (typeof window !== 'undefined' && newToken) {
              localStorage.setItem('accessToken', newToken)
              authHeaders['Authorization'] = `Bearer ${newToken}`
            } else {
              throw new ApiError('Failed to refresh token', 401)
            }
          } else {
            // Refresh failed, clear token
            removeAccessToken()
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            throw new ApiError('Session expired. Please login again.', 401)
          }
        } catch (error) {
          if (error instanceof ApiError) throw error
          removeAccessToken()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          throw new ApiError('Session expired. Please login again.', 401)
        }
      } else {
        authHeaders['Authorization'] = `Bearer ${token}`
      }
    }
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    credentials: 'include', // Include cookies for refresh token
  }

  if (body && !(body instanceof FormData)) {
    config.body = JSON.stringify(body)
  } else if (body instanceof FormData) {
    config.body = body
    // Remove Content-Type header for FormData (browser will set it with boundary)
    delete (config.headers as any)['Content-Type']
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    // Handle 401 Unauthorized
    if (response.status === 401 && requireAuth) {
      removeAccessToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiError('Unauthorized. Please login again.', 401)
    }

    if (!response.ok) {
      // For 400 errors on department getAll, check if it's "failed to find departments"
      // which might mean no departments exist (should return empty array)
      if (response.status === 400 && endpoint.includes('/department/collegeId/')) {
        try {
          const errorJson = await response.json()
          // If the error message is about not finding departments, return empty array
          if (errorJson.message?.toLowerCase().includes('failed to find departments')) {
            return [] as T
          }
        } catch {
          // If can't parse error, continue with normal error handling
        }
      }
      
      let errorMessage = `API Error: ${response.statusText}`
      let errorData: any = null

      try {
        const errorJson = await response.json()
        errorMessage = extractErrorMessage(errorJson)
        errorData = errorJson
      } catch {
        // If response is not JSON, use status text
        errorMessage = `API Error (${response.status}): ${response.statusText}`
      }

      throw new ApiError(errorMessage, response.status, errorData)
    }

    const data = await response.json()
    // Extract data from backend response format
    return extractData<T>(data)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Handle network errors (Failed to fetch)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error)
      console.error('API URL:', `${API_BASE_URL}${endpoint}`)
      throw new ApiError(
        `Unable to connect to server. Please check if the backend is running at ${API_BASE_URL}`,
        0
      )
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    )
  }
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>, requireAuth = true) =>
    request<T>(endpoint, { method: 'GET', headers, requireAuth }),

  post: <T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
    requireAuth = true
  ) =>
    request<T>(endpoint, { method: 'POST', body: data, headers, requireAuth }),

  put: <T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
    requireAuth = true
  ) =>
    request<T>(endpoint, { method: 'PUT', body: data, headers, requireAuth }),

  patch: <T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
    requireAuth = true
  ) =>
    request<T>(endpoint, { method: 'PATCH', body: data, headers, requireAuth }),

  delete: <T>(endpoint: string, headers?: Record<string, string>, requireAuth = true) =>
    request<T>(endpoint, { method: 'DELETE', headers, requireAuth }),
}

// Schedule-specific API functions
export const scheduleApi = {
  generate: async (campusId: string, semester: string) => {
    const response = await api.post<any>(
      '/schedule/generate',
      { campusId, semester }
    )
    // Backend returns { success, message, schedule }
    // extractData will extract the schedule object
    // Schedule object has: { id, semester, generatedBy, sessions, totalSessions }
    return response
  },

  getAll: () => api.get<any[]>('/schedule'),

  getById: (id: string) => api.get<any>(`/schedule/${id}`),
}

// Campus API functions
export const campusApi = {
  getAll: () => api.get<any[]>('/campus'),

  getById: (id: string) => api.get<any>(`/campus/${id}`),

  create: (data: { name: string; city: string; colleges?: string[] }) =>
    api.post<any>('/campus', data),

  update: (id: string, data: Partial<{ name: string; city: string }>) =>
    api.patch<any>(`/campus/${id}`, data),

  delete: (id: string) => api.delete(`/campus/${id}`),
}

// Classroom API functions
export const classroomApi = {
  getAll: (campusName?: string) => {
    const query = campusName ? `?campusName=${encodeURIComponent(campusName)}` : ''
    return api.get<any[]>(`/classroom${query}`)
  },

  getById: (id: string) => api.get<any>(`/classroom/${id}`),

  create: (data: {
    name: string
    capacity: number
    type: 'LAB' | 'LECTURE_HALL'
    campusName: string
  }) => api.post<any>('/classroom', data),

  update: (id: string, data: Partial<{ name: string; capacity: number; type: string }>) =>
    api.patch<any>(`/classroom/${id}`, data),

  delete: (id: string) => api.delete(`/classroom/${id}`),
}

// Instructor API functions
export const instructorApi = {
  getAll: () => api.get<any[]>('/instructor'),

  getById: (id: string) => api.get<any>(`/instructor/${id}`),

  create: (data: any) => api.post<any>('/instructor', data),

  update: (id: string, data: any) => api.put<any>(`/instructor/${id}`, data),

  delete: (id: string) => api.delete(`/instructor/${id}`),
}

// Student Group API functions
export const studentGroupApi = {
  getAll: () => api.get<any[]>('/studentGroup'),

  getById: (id: string) => api.get<any>(`/studentGroup/${id}`),

  create: (data: any) => api.post<any>('/studentGroup', data),

  update: (id: string, data: any) => api.patch<any>(`/studentGroup/${id}`, data),

  delete: (id: string) => api.delete(`/studentGroup/${id}`),
}

// Department API functions
export const departmentApi = {
  getAll: (collegeId: string) => api.get<any[]>(`/department/collegeId/${collegeId}`),

  getById: (id: string) => api.get<any>(`/department/${id}`),

  create: (data: { name: string; code: string; collegeId: string }) =>
    api.post<any>('/department', data),

  update: (id: string, data: Partial<{ name: string; code: string; collegeId: string }>) =>
    api.patch<any>(`/department/${id}`, data),

  delete: (id: string) => api.delete(`/department/${id}`),
}

// College API functions
export const collegeApi = {
  getAll: (campusId: string) => {
    // Backend route is /college/:campusId
    return api.get<any[]>(`/college/${campusId}`)
  },

  getById: (id: string) => api.get<any>(`/college/${id}`),

  create: (data: { name: string; campusId?: string }) =>
    api.post<any>('/college', data),

  update: (id: string, data: Partial<{ name: string; campusId?: string }>) =>
    api.patch<any>(`/college/${id}`, data),

  delete: (id: string) => api.delete(`/college/${id}`),
}

// Course API functions
export const courseApi = {
  getAll: (collegeId?: string) => {
    const query = collegeId ? `?collegeId=${collegeId}` : ''
    return api.get<any[]>(`/course${query}`)
  },

  getById: (id: string) => api.get<any>(`/course/${id}`),

  create: (data: any) => api.post<any>('/course', data),

  update: (id: string, data: any) => api.patch<any>(`/course/${id}`, data),

  delete: (id: string) => api.delete(`/course/${id}`),
}

export { ApiError }

