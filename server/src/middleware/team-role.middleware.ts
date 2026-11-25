
import { RequestHandler } from 'express'
import { z } from 'zod'
import { pool } from '../config/database'

type TeamRole = 'owner' | 'admin' | 'member'

const requireTeamRole = (
  allowedRoles: TeamRole[],
): RequestHandler => {
  return async (req, res, next) => {
    const teamIdResult = z.string().uuid().safeParse(req.params.teamId)

    if (!teamIdResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid team ID',
      })
      return
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
      return
    }

    try {
      const result = await pool.query(
        `SELECT role
         FROM team_members
         WHERE team_id = $1 AND user_id = $2`,
        [teamIdResult.data, req.user.id],
      )

      if (result.rowCount === 0) {
        res.status(403).json({
          success: false,
          message: 'You are not a member of this team',
        })
        return
      }

      const role = result.rows[0].role as TeamRole

      if (!allowedRoles.includes(role)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action',
        })
        return
      }

      req.teamRole = role
      next()
    } catch (error) {
      next(error)
    }
  }
}

export default requireTeamRole
