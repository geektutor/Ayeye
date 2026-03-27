import { QueryClient } from '@tanstack/react-query'

import { ApiRequestError } from './api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ApiRequestError && error.statusCode < 500) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof ApiRequestError) {
          console.error(`API error ${error.statusCode}: ${error.message}`)
        }
      },
    },
  },
})
