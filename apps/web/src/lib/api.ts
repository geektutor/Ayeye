import type { ApiError } from '@ayeye/types'

const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001'

export class ApiRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const body = await response.json()

  if (!response.ok) {
    const error = body as ApiError & { errors?: { field: string; message: string }[] }
    const message =
      error.error ??
      (error.errors?.map((e) => e.message).join(', ')) ??
      'Request failed'
    throw new ApiRequestError(response.status, message, error.details ?? error.errors)
  }

  return body as T
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { method: 'GET', ...options }),
  post: <T>(path: string, data: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data), ...options }),
  patch: <T>(path: string, data: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data), ...options }),
  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { method: 'DELETE', ...options }),
}
