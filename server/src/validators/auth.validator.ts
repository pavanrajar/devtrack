
import { z } from 'zod'

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must contain at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),

  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(255)
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, 'Password must contain at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((value) => value.toLowerCase()),

  password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
