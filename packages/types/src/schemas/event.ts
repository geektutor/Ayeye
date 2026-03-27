import { z } from 'zod'

export const noShowPolicyEnum = z.enum(['CHARITY', 'SCHOLARSHIP', 'REDISTRIBUTE', 'EVENT_BUDGET'])

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200),
  description: z.string().max(2000).optional(),
  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO 8601 datetime' })
    .refine((val) => new Date(val) > new Date(), { message: 'Event date must be in the future' }),
  venue: z.string().min(1, 'Venue is required').max(500),
  depositAmount: z
    .number()
    .int()
    .min(50000, 'Deposit must be at least ₦500 (50,000 kobo)')
    .max(5000000, 'Deposit cannot exceed ₦50,000 (5,000,000 kobo)'),
  noShowPolicy: noShowPolicyEnum,
  maxAttendees: z.number().int().positive().optional(),
})

export const updateEventSchema = createEventSchema.partial()

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type NoShowPolicy = z.infer<typeof noShowPolicyEnum>
