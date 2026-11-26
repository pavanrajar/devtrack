import { RequestHandler } from 'express'
import { getTeamDashboard } from '../services/dashboard.service'

const getDashboard: RequestHandler = async (req, res) => {
  const dashboard = await getTeamDashboard(
    req.params.teamId as string,
    req.user!.id,
  )

  res.status(200).json({
    success: true,
    data: dashboard,
  })
}

export default getDashboard
