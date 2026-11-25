
import { Router } from 'express'
import authenticate from '../middleware/auth.middleware'
import validate from '../middleware/validate.middleware'
import validateUuidParam from '../middleware/validate-uuid.middleware'

import {
  createComment,
  listTaskComments,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller'

import {
  createCommentSchema,
  updateCommentSchema,
} from '../validators/comment.validator'

const router = Router()

router.use(authenticate)

// Task comments
router.post(
  '/tasks/:taskId/comments',
  validateUuidParam('taskId'),
  validate(createCommentSchema),
  createComment,
)

router.get(
  '/tasks/:taskId/comments',
  validateUuidParam('taskId'),
  listTaskComments,
)

// Individual comment operations
router.patch(
  '/comments/:commentId',
  validateUuidParam('commentId'),
  validate(updateCommentSchema),
  updateComment,
)

router.delete(
  '/comments/:commentId',
  validateUuidParam('commentId'),
  deleteComment,
)

export default router
