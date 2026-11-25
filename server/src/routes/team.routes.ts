
import { Router } from 'express'
import authenticate from '../middleware/auth.middleware'
import validate from '../middleware/validate.middleware'
import requireTeamRole from '../middleware/team-role.middleware'
import {
  createTeam,
  listTeams,
  addTeamMember,
} from '../controllers/team.controller'
import {
  createTeamSchema,
  addTeamMemberSchema,
} from '../validators/team.validator'

const router = Router()

// Every team endpoint requires authentication.
router.use(authenticate)

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

export default router
