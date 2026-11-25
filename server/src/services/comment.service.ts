
import { pool } from '../config/database'
import { getProjectAccess } from './project.service'
import type { CreateCommentInput } from '../validators/comment.validator'

const httpError = (message: string, statusCode: number) => {
  return Object.assign(new Error(message), { statusCode })
}

const verifyTaskAccess = async (taskId: string, userId: string) => {
  const result = await pool.query(
    'SELECT id, project_id FROM tasks WHERE id = $1',
    [taskId],
  )

  const task = result.rows[0]

  if (!task) {
    throw httpError('Task not found', 404)
  }

  await getProjectAccess(task.project_id, userId)

  return task
}

export const createComment = async (
  taskId: string,
  userId: string,
  input: CreateCommentInput,
) => {
  await verifyTaskAccess(taskId, userId)

  const result = await pool.query(
    `INSERT INTO task_comments (task_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [taskId, userId, input.content],
  )

  return result.rows[0]
}

export const getTaskComments = async (
  taskId: string,
  userId: string,
) => {
  await verifyTaskAccess(taskId, userId)

  const result = await pool.query(
    `SELECT
       c.id,
       c.task_id,
       c.user_id,
       c.content,
       c.created_at,
       c.updated_at,
       u.full_name AS author_name
     FROM task_comments c
     INNER JOIN users u ON u.id = c.user_id
     WHERE c.task_id = $1
     ORDER BY c.created_at ASC`,
    [taskId],
  )

  return result.rows
}

export const updateComment = async (
  commentId: string,
  userId: string,
  content: string,
) => {
  const result = await pool.query(
    `UPDATE task_comments
     SET content = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [content, commentId, userId],
  )

  if (result.rowCount === 0) {
    throw httpError(
      'Comment not found or you are not allowed to edit it',
      404,
    )
  }

  return result.rows[0]
}

export const deleteComment = async (
  commentId: string,
  userId: string,
) => {
  const result = await pool.query(
    `DELETE FROM task_comments
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [commentId, userId],
  )

  if (result.rowCount === 0) {
    throw httpError(
      'Comment not found or you are not allowed to delete it',
      404,
    )
  }

  return { message: 'Comment deleted successfully' }
}
