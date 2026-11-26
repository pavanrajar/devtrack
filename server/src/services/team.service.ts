
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

export const getTeamMembers = async (teamId: string) => {
  const result = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       tm.role,
       tm.joined_at
     FROM team_members tm
     INNER JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = $1
     ORDER BY
       CASE tm.role
         WHEN 'owner' THEN 0
         WHEN 'admin' THEN 1
         ELSE 2
       END,
       tm.joined_at ASC`,
    [teamId],
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

export const removeTeamMember = async (
  teamId: string,
  userId: string,
  actorRole: 'owner' | 'admin',
) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const membership = await client.query(
      `SELECT role
       FROM team_members
       WHERE team_id = $1 AND user_id = $2
       FOR UPDATE`,
      [teamId, userId],
    )

    if (membership.rowCount === 0) {
      throw createHttpError('Team member not found', 404)
    }

    const targetRole = membership.rows[0].role as 'owner' | 'admin' | 'member'

    if (targetRole === 'owner') {
      throw createHttpError('The team owner cannot be removed', 409)
    }

    if (actorRole === 'admin' && targetRole === 'admin') {
      throw createHttpError('Only the team owner can remove an admin', 403)
    }

    const assignedTasks = await client.query(
      `SELECT COUNT(*) AS count
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id
       WHERE p.team_id = $1 AND t.assigned_to = $2`,
      [teamId, userId],
    )

    if (Number(assignedTasks.rows[0].count) > 0) {
      throw createHttpError(
        'Reassign this member’s tasks before removing them from the team',
        409,
      )
    }

    const lastManagedProject = await client.query(
      `SELECT p.id
       FROM projects p
       INNER JOIN project_members target
         ON target.project_id = p.id AND target.user_id = $2
       WHERE p.team_id = $1
         AND target.role = 'manager'
         AND NOT EXISTS (
           SELECT 1
           FROM project_members other_manager
           WHERE other_manager.project_id = p.id
             AND other_manager.role = 'manager'
             AND other_manager.user_id <> $2
         )
       LIMIT 1`,
      [teamId, userId],
    )

    if ((lastManagedProject.rowCount ?? 0) > 0) {
      throw createHttpError(
        'Assign another manager to this member’s projects before removing them',
        409,
      )
    }

    await client.query(
      `DELETE FROM project_members pm
       USING projects p
       WHERE pm.project_id = p.id
         AND p.team_id = $1
         AND pm.user_id = $2`,
      [teamId, userId],
    )

    await client.query(
      `DELETE FROM team_members
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId],
    )

    await client.query('COMMIT')
    return { message: 'Team member removed successfully' }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
