/**
 * Response transformers for backend API responses
 * Backend returns responses in format: { message: string, data?: any }
 */

interface BackendResponse<T = any> {
  message?: string
  data?: T
  [key: string]: any
}

/**
 * Extract data from backend response format
 * Handles multiple formats:
 * - { message, data }
 * - { success, message, schedule } (schedule endpoint)
 * - { success, message, ...other fields }
 * - Direct data responses
 */
export function extractData<T>(response: BackendResponse<T> | T): T {
  if (!response || typeof response !== 'object') {
    return response as T
  }

  // If response has a 'data' property, extract it
  if ('data' in response && response.data !== undefined) {
    return (response as BackendResponse<T>).data as T
  }

  // If response has 'schedule' property (schedule endpoint format)
  if ('schedule' in response) {
    return (response as any).schedule as T
  }

  // If response has 'campuses' property (campus getAll endpoint format)
  if ('campuses' in response) {
    return (response as any).campuses as T
  }

  // If response has 'campus' property (campus create/get endpoint format)
  if ('campus' in response) {
    return (response as any).campus as T
  }

  // If response has 'departments' property (department getAll endpoint format)
  if ('departments' in response) {
    return (response as any).departments as T
  }

  // If response has 'department' property (department create/get endpoint format)
  if ('department' in response) {
    return (response as any).department as T
  }

  // If response has 'colleges' property (college getAll endpoint format)
  if ('colleges' in response) {
    return (response as any).colleges as T
  }

  // If response has 'college' property (college create/get endpoint format)
  if ('college' in response) {
    return (response as any).college as T
  }

  // If response has 'courses' property (course getAll endpoint format)
  if ('courses' in response) {
    return (response as any).courses as T
  }

  // If response has 'course' property (course create/get endpoint format)
  if ('course' in response) {
    return (response as any).course as T
  }

  // If response has 'success' and other properties, extract the main data
  // Skip 'success' and 'message' fields
  if ('success' in response) {
    const { success, message, ...rest } = response as any
    // If there's only one other property, return it
    const keys = Object.keys(rest)
    if (keys.length === 1) {
      return rest[keys[0]] as T
    }
    // Otherwise return the whole object without success/message
    return rest as T
  }

  // If response has 'message' and only one other property, extract that property
  if ('message' in response) {
    const { message, ...rest } = response as any
    const keys = Object.keys(rest)
    // If there's only one other property, return it
    if (keys.length === 1) {
      return rest[keys[0]] as T
    }
    // If there are multiple properties, return the rest object
    if (keys.length > 1) {
      return rest as T
    }
  }

  // Otherwise return the response as-is
  return response as T
}

/**
 * Extract error message from backend error response
 */
export function extractErrorMessage(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

/**
 * Transform backend campus response
 */
export function transformCampus(campus: any) {
  return {
    id: campus.id,
    name: campus.name,
    city: campus.city || '',
    colleges: campus.colleges || [],
  }
}

/**
 * Transform backend classroom response
 */
export function transformClassroom(classroom: any) {
  return {
    id: classroom.id,
    name: classroom.name,
    capacity: classroom.capacity,
    type: classroom.type, // LAB or LECTURE_HALL
    campusId: classroom.campusId,
  }
}

