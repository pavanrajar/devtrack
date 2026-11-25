
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Project name must contain at least 3 characters')
    .max(100, 'Project name cannot exceed 100 characters'),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
})

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .optional(),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided',
)

export const addProjectMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((value) => value.toLowerCase()),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>
