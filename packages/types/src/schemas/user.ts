import { z } from 'zod'

export const createOrganizerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type CreateOrganizerInput = z.infer<typeof createOrganizerSchema>
export type LoginInput = z.infer<typeof loginSchema>
