
import { Pool } from 'pg'
import { env } from './env'

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', {
    name: error.name,
  })
})



export const connectDatabase = async (): Promise<void> => {
  try {
    await pool.query('SELECT 1')
    console.log('PostgreSQL connected successfully')
  } catch (error) {
    console.error('PostgreSQL connection failed:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      code:
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
          ? error.code
          : undefined,
    })
    throw error
  }
}
