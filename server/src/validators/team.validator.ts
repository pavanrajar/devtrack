
import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Team name must contain at least 3 characters')
    .max(100, 'Team name cannot exceed 100 characters'),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
})

export const addTeamMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((value) => value.toLowerCase()),

  role: z.enum(['admin', 'member']).default('member'),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>
