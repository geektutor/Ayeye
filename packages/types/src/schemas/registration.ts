import { z } from 'zod'

const nigerianPhoneRegex = /^(\+?234|0)[789][01]\d{8}$/

export const registerAttendeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(nigerianPhoneRegex, 'Phone must be a valid Nigerian phone number (e.g. 08012345678)'),
})

export type RegisterAttendeeInput = z.infer<typeof registerAttendeeSchema>
