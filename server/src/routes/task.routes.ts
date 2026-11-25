
import { Router } from 'express'
import authenticate from '../middleware/auth.middleware'
import validate from '../middleware/validate.middleware'
import validateUuidParam from '../middleware/validate-uuid.middleware'

import {
  createTask,
  listProjectTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
} from '../controllers/task.controller'

import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
} from '../validators/task.validator'

const router = Router()

router.use(authenticate)



// Project-scoped task routes
router.post(
  '/projects/:projectId/tasks',
  validateUuidParam('projectId'),
  validate(createTaskSchema),
  createTask,
)

router.get(
  '/projects/:projectId/tasks',
  validateUuidParam('projectId'),
  listProjectTasks,
)

// Individual task routes
router.get(
  '/tasks/:taskId',
  validateUuidParam('taskId'),
  getTask,
)

router.patch(
  '/tasks/:taskId',
  validateUuidParam('taskId'),
  validate(updateTaskSchema),
  updateTask,
)

router.patch(
  '/tasks/:taskId/status',
  validateUuidParam('taskId'),
  validate(updateTaskStatusSchema),
  updateTaskStatus,
)

router.patch(
  '/tasks/:taskId/assign',
  validateUuidParam('taskId'),
  validate(assignTaskSchema),
  assignTask,
)

router.delete(
  '/tasks/:taskId',
  validateUuidParam('taskId'),
  deleteTask,
)

export default router
