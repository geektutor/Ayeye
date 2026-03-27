import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CreateEventInput, UpdateEventInput } from '@ayeye/types'

import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export interface ApiEvent {
  id: string
  name: string
  description?: string
  date: string
  venue: string
  depositAmount: number
  noShowPolicy: string
  maxAttendees?: number
  organizerId: string
  status: string
  registrationLink: string
  createdAt: string
  totalRegistrations?: number
  totalCheckins?: number
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function useEvents() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['events'],
    queryFn: () =>
      api.get<{ success: true; data: ApiEvent[] }>('/api/events', {
        headers: authHeaders(token),
      }),
    enabled: !!token,
    select: (res) => res.data,
  })
}

export function useEvent(id: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['events', id],
    queryFn: () =>
      api.get<{ success: true; data: ApiEvent }>(`/api/events/${id}`, {
        headers: authHeaders(token),
      }),
    enabled: !!token && !!id,
    select: (res) => res.data,
  })
}

// Public hook — no auth required, used on the discover page
export function usePublicEvents() {
  return useQuery({
    queryKey: ['events', 'public'],
    queryFn: () =>
      api.get<{ success: true; data: ApiEvent[] }>('/api/events/public'),
    select: (res) => res.data,
  })
}

// Public hook — no auth required, used on the attendee registration page
export function usePublicEvent(registrationLink: string) {
  return useQuery({
    queryKey: ['events', 'public', registrationLink],
    queryFn: () =>
      api.get<{ success: true; data: ApiEvent }>(`/api/events/public/${registrationLink}`),
    enabled: !!registrationLink,
    select: (res) => res.data,
  })
}

export interface EventStats {
  totalRegistrations: number
  checkedIn: number
  refunded: number
  noShows: number
}

export function useEventStats(eventId: string, live = false) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['events', eventId, 'stats'],
    queryFn: () =>
      api.get<{ success: true; data: EventStats }>(`/api/events/${eventId}/stats`, {
        headers: authHeaders(token),
      }),
    enabled: !!token && !!eventId,
    select: (res) => res.data,
    refetchInterval: live ? 10_000 : false,
  })
}

export interface EventRegistration {
  id: string
  status: string
  depositAmount: number
  paidAt?: string
  checkedInAt?: string
  refundedAt?: string
  createdAt: string
  attendee: { name: string; email: string; phone?: string }
}

export function useEventRegistrations(eventId: string, live = false) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['events', eventId, 'registrations'],
    queryFn: () =>
      api.get<{ success: true; data: EventRegistration[] }>(`/api/events/${eventId}/registrations`, {
        headers: authHeaders(token),
      }),
    enabled: !!token && !!eventId,
    select: (res) => res.data,
    refetchInterval: live ? 10_000 : false,
  })
}

export function usePublishEvent() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) =>
      api.post<{ success: true; data: ApiEvent }>(`/api/events/${eventId}/publish`, {}, {
        headers: authHeaders(token),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useCloseEvent() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) =>
      api.post<{ success: true; data: ApiEvent }>(`/api/events/${eventId}/close`, {}, {
        headers: authHeaders(token),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useCreateEvent() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEventInput) =>
      api.post<{ success: true; data: ApiEvent }>('/api/events', data, {
        headers: authHeaders(token),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent(eventId: string) {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateEventInput) =>
      api.patch<{ success: true; data: ApiEvent }>(`/api/events/${eventId}`, data, {
        headers: authHeaders(token),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
