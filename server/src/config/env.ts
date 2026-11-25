
import dotenv from 'dotenv'
import { resolve } from 'path'
import { z } from 'zod'

// Load the root-level .env file
const envFile =
  process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env'

dotenv.config({ path: resolve(__dirname, '../../../', envFile) })

// Define required environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(5000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1d'),

  CLIENT_URL: z.string().url(),
})

// Validate environment variables
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:')
  console.error(parsedEnv.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsedEnv.data
