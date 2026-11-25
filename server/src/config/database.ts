
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
  console.error('Unexpected PostgreSQL pool error:', error)
})



export const connectDatabase = async (): Promise<void> => {
  try {
    await pool.query('SELECT 1')
    console.log('PostgreSQL connected successfully')
  } catch (error) {
    console.error('PostgreSQL connection failed:', error)
    throw error
  }
}
