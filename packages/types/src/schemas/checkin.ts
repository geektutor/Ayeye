import { z } from 'zod'

export const checkInSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID is required'),
})

export type CheckInInput = z.infer<typeof checkInSchema>
