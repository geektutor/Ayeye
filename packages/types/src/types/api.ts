export interface ApiResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  details?: unknown
  statusCode: number
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError
