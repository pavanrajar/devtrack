
import { pool } from '../config/database'
import {
  CreateTeamInput,
  AddTeamMemberInput,
} from '../validators/team.validator'

const createHttpError = (message: string, statusCode: number) => {
  return Object.assign(new Error(message), { statusCode })
}

export const createTeam = async (
  userId: string,
  input: CreateTeamInput,
) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const teamResult = await client.query(
      `INSERT INTO teams (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_at`,
      [input.name, input.description ?? null, userId],
    )

    const team = teamResult.rows[0]

    await client.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [team.id, userId],
    )

    await client.query('COMMIT')

    return {
      ...team,
      role: 'owner',
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const getUserTeams = async (userId: string) => {
  const result = await pool.query(
    `SELECT
       t.id,
       t.name,
       t.description,
       t.created_at,
       tm.role,
       tm.joined_at
     FROM teams t
     INNER JOIN team_members tm ON tm.team_id = t.id
     WHERE tm.user_id = $1
     ORDER BY tm.joined_at DESC`,
    [userId],
  )

  return result.rows
}

export const addTeamMember = async (
  teamId: string,
  input: AddTeamMemberInput,
) => {
  try {
    const result = await pool.query(
      `INSERT INTO team_members (team_id, user_id, role)
       SELECT $1, u.id, $3
       FROM users u
       WHERE LOWER(u.email) = LOWER($2)
       RETURNING user_id, role, joined_at`,
      [teamId, input.email, input.role],
    )

    if (result.rowCount === 0) {
      throw createHttpError('No user found with this email address', 404)
    }

    const memberResult = await pool.query(
      `SELECT id, full_name, email
       FROM users
       WHERE id = $1`,
      [result.rows[0].user_id],
    )

    return {
      ...memberResult.rows[0],
      role: result.rows[0].role,
      joinedAt: result.rows[0].joined_at,
    }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw createHttpError('This user is already a team member', 409)
    }

    throw error
  }
}
