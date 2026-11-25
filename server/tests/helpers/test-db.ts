
import { pool } from '../../src/config/database'
import { env } from '../../src/config/env'

export const cleanTestDatabase = async (): Promise<void> => {
  if (env.NODE_ENV !== 'test' || env.DB_NAME !== 'devtrack_test') {
    throw new Error(
      'Database cleanup blocked: only the devtrack_test database is allowed.',
    )
  }

  await pool.query(`
    TRUNCATE TABLE
      task_comments,
      tasks,
      project_members,
      projects,
      team_members,
      teams,
      users
    RESTART IDENTITY CASCADE
  `)
}

export const closeTestDatabase = async (): Promise<void> => {
  await pool.end()
}
