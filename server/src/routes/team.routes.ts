
import { Router } from 'express'
import authenticate from '../middleware/auth.middleware'
import validate from '../middleware/validate.middleware'
import validateUuidParam from '../middleware/validate-uuid.middleware'
import requireTeamRole from '../middleware/team-role.middleware'
import getDashboard from '../controllers/dashboard.controller'
import {
  createTeam,
  listTeams,
  addTeamMember,
  listTeamMembers,
  removeTeamMember,
} from '../controllers/team.controller'
import {
  createTeamSchema,
  addTeamMemberSchema,
} from '../validators/team.validator'

const router = Router()

// Every team endpoint requires authentication.
router.use(authenticate)

router.get(
  '/:teamId/members',
  requireTeamRole(['owner', 'admin', 'member']),
  listTeamMembers,
)

router.get(
  '/:teamId/dashboard',
  requireTeamRole(['owner', 'admin', 'member']),
  validateUuidParam('teamId'),
  getDashboard,
)

router.post(
  '/',
  validate(createTeamSchema),
  createTeam,
)

router.get('/', listTeams)

router.post(
  '/:teamId/members',
  requireTeamRole(['owner', 'admin']),
  validate(addTeamMemberSchema),
  addTeamMember,
)

router.delete(
  '/:teamId/members/:userId',
  requireTeamRole(['owner', 'admin']),
  validateUuidParam('userId'),
  removeTeamMember,
)

export default router
