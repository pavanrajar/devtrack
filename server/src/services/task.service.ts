
import { pool } from '../config/database'
import { getProjectAccess } from './project.service'
import type { CreateTaskInput } from '../validators/task.validator'

const httpError = (message: string, statusCode: number) => {
  return Object.assign(new Error(message), { statusCode })
}

export const createTask = async (
  projectId: string,
  userId: string,
  input: CreateTaskInput,
) => {
  await getProjectAccess(projectId, userId)

  if (input.assignedTo) {
    const member = await pool.query(
      `SELECT 1
       FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, input.assignedTo],
    )

    if (member.rowCount === 0) {
      throw httpError(
        'Assignee must be a member of this project',
        400,
      )
    }
  }

  const result = await pool.query(
    `INSERT INTO tasks (
       project_id,
       title,
       description,
       priority,
       assigned_to,
       created_by,
       due_date
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      projectId,
      input.title,
      input.description ?? null,
      input.priority,
      input.assignedTo ?? null,
      userId,
      input.dueDate ?? null,
    ],
  )

  return result.rows[0]
}

export const getProjectTasks = async (
  projectId: string,
  userId: string,
) => {
  await getProjectAccess(projectId, userId)

  const result = await pool.query(
    `SELECT
       t.*,
       u.full_name AS assignee_name,
       creator.full_name AS creator_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     INNER JOIN users creator ON creator.id = t.created_by
     WHERE t.project_id = $1
     ORDER BY t.position ASC, t.created_at DESC`,
    [projectId],
  )

  return result.rows
}

import type {
  UpdateTaskInput,
} from '../validators/task.validator'

const getTaskAccess = async (taskId: string, userId: string) => {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE id = $1',
    [taskId],
  )

  const task = result.rows[0]

  if (!task) {
    throw httpError('Task not found', 404)
  }

  const access = await getProjectAccess(task.project_id, userId)

  return { task, ...access }
}

export const getTaskById = async (
  taskId: string,
  userId: string,
) => {
  const { task } = await getTaskAccess(taskId, userId)

  return task
}

export const updateTask = async (
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
) => {
  await getTaskAccess(taskId, userId)

  const updates: { column: string; value: unknown }[] = []

  if (input.title !== undefined) {
    updates.push({ column: 'title', value: input.title })
  }

  if (input.description !== undefined) {
    updates.push({ column: 'description', value: input.description })
  }

  if (input.priority !== undefined) {
    updates.push({ column: 'priority', value: input.priority })
  }

  if (input.dueDate !== undefined) {
    updates.push({ column: 'due_date', value: input.dueDate })
  }

  const values = updates.map((item) => item.value)
  const setClause = updates
    .map((item, index) => `${item.column} = $${index + 1}`)
    .join(', ')

  const result = await pool.query(
    `UPDATE tasks
     SET ${setClause}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length + 1}
     RETURNING *`,
    [...values, taskId],
  )

  return result.rows[0]
}

export const updateTaskStatus = async (
  taskId: string,
  userId: string,
  status: 'backlog' | 'in_progress' | 'in_review' | 'done',
) => {
  await getTaskAccess(taskId, userId)

  const result = await pool.query(
    `UPDATE tasks
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [status, taskId],
  )

  return result.rows[0]
}

export const assignTask = async (
  taskId: string,
  userId: string,
  assignedTo: string | null,
) => {
  const { task, canManage } = await getTaskAccess(taskId, userId)

  if (!canManage) {
    throw httpError('Only project managers can assign tasks', 403)
  }

  if (assignedTo) {
    const member = await pool.query(
      `SELECT 1
       FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [task.project_id, assignedTo],
    )

    if (member.rowCount === 0) {
      throw httpError('Assignee must be a member of this project', 400)
    }
  }

  const result = await pool.query(
    `UPDATE tasks
     SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [assignedTo, taskId],
  )

  return result.rows[0]
}

export const deleteTask = async (
  taskId: string,
  userId: string,
) => {
  const { canManage } = await getTaskAccess(taskId, userId)

  if (!canManage) {
    throw httpError('Only project managers can delete tasks', 403)
  }

  await pool.query(
    'DELETE FROM tasks WHERE id = $1',
    [taskId],
  )

  return { message: 'Task deleted successfully' }
}
