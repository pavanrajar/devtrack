
import { pool } from '../config/database'
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectMemberInput,
} from '../validators/project.validator'

type TeamRole = 'owner' | 'admin' | 'member'
type ProjectRole = 'manager' | 'member'

const httpError = (message: string, statusCode: number) =>
  Object.assign(new Error(message), { statusCode })

const handleDatabaseError = (error: unknown): never => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  ) {
    throw httpError('A project with this name already exists in this team', 409)
  }

  throw error
}
export const getProjectMembers = async (
  projectId: string,
  userId: string,
) => {
  await getProjectAccess(projectId, userId)

  const result = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       pm.role,
       pm.joined_at
     FROM project_members pm
     INNER JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY pm.joined_at ASC`,
    [projectId],
  )

  return result.rows
}
export const getProjectAccess = async (projectId: string, userId: string) => {
  const result = await pool.query(
    `SELECT
       p.id,
       p.team_id,
       p.name,
       p.description,
       p.status,
       p.created_by,
       p.created_at,
       p.updated_at,
       tm.role AS team_role,
       pm.role AS project_role
     FROM projects p
     INNER JOIN team_members tm
       ON tm.team_id = p.team_id AND tm.user_id = $2
     LEFT JOIN project_members pm
       ON pm.project_id = p.id AND pm.user_id = $2
     WHERE p.id = $1`,
    [projectId, userId],
  )

  const project = result.rows[0]

  if (!project) {
    throw httpError('Project not found or you do not belong to its team', 404)
  }

  const teamRole = project.team_role as TeamRole
  const projectRole = project.project_role as ProjectRole | null

  if (teamRole === 'member' && !projectRole) {
    throw httpError('You do not have access to this project', 403)
  }

  return {
    project,
    canManage:
      teamRole === 'owner' ||
      teamRole === 'admin' ||
      projectRole === 'manager',
  }
}

export const createProject = async (
  teamId: string,
  userId: string,
  input: CreateProjectInput,
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
      throw httpError('You are not a member of this team', 403)
    }

    const teamRole = membership.rows[0].role as TeamRole

    if (teamRole !== 'owner' && teamRole !== 'admin') {
      throw httpError('Only team owners and admins can create projects', 403)
    }

    const result = await client.query(
      `INSERT INTO projects (team_id, name, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, team_id, name, description, status, created_by,
                 created_at, updated_at`,
      [teamId, input.name, input.description ?? null, userId],
    )

    const project = result.rows[0]

    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'manager')`,
      [project.id, userId],
    )

    await client.query('COMMIT')

    return {
      ...project,
      projectRole: 'manager',
    }
  } catch (error) {
    await client.query('ROLLBACK')
    handleDatabaseError(error)
  } finally {
    client.release()
  }
}

export const getTeamProjects = async (
  teamId: string,
  userId: string,
) => {
  const membership = await pool.query(
    `SELECT role
     FROM team_members
     WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId],
  )

  if (membership.rowCount === 0) {
    throw httpError('You are not a member of this team', 403)
  }

  const teamRole = membership.rows[0].role as TeamRole

  const result = await pool.query(
    `SELECT
       p.id,
       p.team_id,
       p.name,
       p.description,
       p.status,
       p.created_by,
       p.created_at,
       p.updated_at,
       pm.role AS project_role
     FROM projects p
     LEFT JOIN project_members pm
       ON pm.project_id = p.id AND pm.user_id = $2
     WHERE p.team_id = $1
       AND (
         $3 IN ('owner', 'admin')
         OR pm.user_id IS NOT NULL
       )
     ORDER BY p.created_at DESC`,
    [teamId, userId, teamRole],
  )

  return result.rows
}

export const getProjectById = async (
  projectId: string,
  userId: string,
) => {
  const { project } = await getProjectAccess(projectId, userId)

  return {
    id: project.id,
    teamId: project.team_id,
    name: project.name,
    description: project.description,
    status: project.status,
    createdBy: project.created_by,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    projectRole: project.project_role,
  }
}

export const updateProject = async (
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
) => {
  const { canManage } = await getProjectAccess(projectId, userId)

  if (!canManage) {
    throw httpError('You do not have permission to update this project', 403)
  }

  try {
    const result = await pool.query(
      `UPDATE projects
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'active'
       RETURNING id, team_id, name, description, status,
                 created_by, created_at, updated_at`,
      [input.name ?? null, input.description ?? null, projectId],
    )

    if (result.rowCount === 0) {
      throw httpError('Project not found or already archived', 404)
    }

    return result.rows[0]
  } catch (error) {
    handleDatabaseError(error)
  }
}

export const archiveProject = async (
  projectId: string,
  userId: string,
) => {
  const { canManage } = await getProjectAccess(projectId, userId)

  if (!canManage) {
    throw httpError('You do not have permission to archive this project', 403)
  }

  const result = await pool.query(
    `UPDATE projects
     SET status = 'archived', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'active'
     RETURNING id, name, status, updated_at`,
    [projectId],
  )

  if (result.rowCount === 0) {
    throw httpError('Project not found or already archived', 404)
  }

  return result.rows[0]
}

export const addProjectMember = async (
  projectId: string,
  userId: string,
  input: AddProjectMemberInput,
) => {
  const { project, canManage } = await getProjectAccess(projectId, userId)

  if (!canManage) {
    throw httpError('You do not have permission to manage project members', 403)
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const result = await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       SELECT $1, u.id, 'member'
       FROM users u
       INNER JOIN team_members tm
         ON tm.user_id = u.id AND tm.team_id = $3
       WHERE LOWER(u.email) = LOWER($2)
       RETURNING user_id, role, joined_at`,
      [projectId, input.email, project.team_id],
    )

    if (result.rowCount === 0) {
      throw httpError('User not found or is not a member of this team', 404)
    }

    const member = await client.query(
      `SELECT id, full_name, email
       FROM users
       WHERE id = $1`,
      [result.rows[0].user_id],
    )

    await client.query('COMMIT')

    return {
      ...member.rows[0],
      role: result.rows[0].role,
      joinedAt: result.rows[0].joined_at,
    }
  } catch (error) {
    await client.query('ROLLBACK')

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw httpError('This user is already a project member', 409)
    }

    throw error
  } finally {
    client.release()
  }
}

export const removeProjectMember = async (
  projectId: string,
  userId: string,
  actorId: string,
) => {
  const { canManage } = await getProjectAccess(projectId, actorId)

  if (!canManage) {
    throw httpError('You do not have permission to manage project members', 403)
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(
      'SELECT id FROM projects WHERE id = $1 FOR UPDATE',
      [projectId],
    )

    const membership = await client.query(
      `SELECT role
       FROM project_members
       WHERE project_id = $1 AND user_id = $2
       FOR UPDATE`,
      [projectId, userId],
    )

    if (membership.rowCount === 0) {
      throw httpError('Project member not found', 404)
    }

    if (membership.rows[0].role === 'manager') {
      const managers = await client.query(
        `SELECT COUNT(*) AS count
         FROM project_members
         WHERE project_id = $1 AND role = 'manager'`,
        [projectId],
      )

      if (Number(managers.rows[0].count) <= 1) {
        throw httpError('A project must retain at least one manager', 409)
      }
    }

    const assignedTasks = await client.query(
      `SELECT COUNT(*) AS count
       FROM tasks
       WHERE project_id = $1 AND assigned_to = $2`,
      [projectId, userId],
    )

    if (Number(assignedTasks.rows[0].count) > 0) {
      throw httpError(
        'Reassign this member’s tasks before removing them from the project',
        409,
      )
    }

    await client.query(
      `DELETE FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId],
    )

    await client.query('COMMIT')
    return { message: 'Project member removed successfully' }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
