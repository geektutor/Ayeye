import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { AuthUser } from '../context/AuthContext'

interface AuthResponse {
  success: true
  data: { token: string; user: AuthUser }
}

export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.post<AuthResponse>('/api/auth/login', { email, password }),
    onSuccess: (res) => {
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    },
  })
}

export function useRegisterOrganizer() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({
      name,
      email,
      password,
    }: {
      name: string
      email: string
      password: string
    }) => api.post<AuthResponse>('/api/auth/register', { name, email, password }),
    onSuccess: (res) => {
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    },
  })
}
