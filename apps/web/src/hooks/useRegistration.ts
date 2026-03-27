import { useMutation } from '@tanstack/react-query'

import type { RegisterAttendeeInput } from '@ayeye/types'

import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export function useRegisterAttendee(eventId: string) {
  return useMutation({
    mutationFn: (data: RegisterAttendeeInput) =>
      api.post<{
        success: true
        data: { registrationId: string; paymentUrl: string; depositAmount: number }
      }>(`/api/events/${eventId}/register`, data),
  })
}

export function useCheckIn() {
  const { token } = useAuth()

  return useMutation({
    mutationFn: (registrationId: string) =>
      api.post<{
        success: true
        data: { registrationId: string; paycode: string; message: string }
      }>(
        '/api/checkin',
        { registrationId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      ),
  })
}
