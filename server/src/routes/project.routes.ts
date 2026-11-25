
import { Router } from 'express'
import authenticate from '../middleware/auth.middleware'
import validate from '../middleware/validate.middleware'
import validateUuidParam from '../middleware/validate-uuid.middleware'
import {
  createProject,
  listTeamProjects,
  getProject,
  updateProject,
  archiveProject,
  addProjectMember,
} from '../controllers/project.controller'
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
} from '../validators/project.validator'

const router = Router()

// All project endpoints require authentication.
router.use(authenticate)

// Team-scoped project endpoints
router.post(
  '/teams/:teamId/projects',
  validateUuidParam('teamId'),
  validate(createProjectSchema),
  createProject,
)

router.get(
  '/teams/:teamId/projects',
  validateUuidParam('teamId'),
  listTeamProjects,
)

// Individual project endpoints
router.get(
  '/projects/:projectId',
  validateUuidParam('projectId'),
  getProject,
)

router.patch(
  '/projects/:projectId',
  validateUuidParam('projectId'),
  validate(updateProjectSchema),
  updateProject,
)

router.patch(
  '/projects/:projectId/archive',
  validateUuidParam('projectId'),
  archiveProject,
)

router.post(
  '/projects/:projectId/members',
  validateUuidParam('projectId'),
  validate(addProjectMemberSchema),
  addProjectMember,
)

export default router
