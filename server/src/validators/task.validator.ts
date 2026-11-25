
import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided',
)

export const updateTaskStatusSchema = z.object({
  status: z.enum(['backlog', 'in_progress', 'in_review', 'done']),
})

export const assignTaskSchema = z.object({
  assignedTo: z.string().uuid().nullable(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
