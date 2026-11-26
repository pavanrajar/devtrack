
import { RequestHandler } from 'express'
import {
  createTeam as createTeamService,
  getUserTeams,
  getTeamMembers,
  addTeamMember as addTeamMemberService,
  removeTeamMember as removeTeamMemberService,
} from '../services/team.service'
import {
  CreateTeamInput,
  AddTeamMemberInput,
} from '../validators/team.validator'

export const createTeam: RequestHandler = async (req, res) => {
  const team = await createTeamService(
    req.user!.id,
    req.body as CreateTeamInput,
  )

  res.status(201).json({
    success: true,
    message: 'Team created successfully',
    data: team,
  })
}
export const listTeams: RequestHandler = async (req, res) => {
  const teams = await getUserTeams(req.user!.id)

  res.status(200).json({
    success: true,
    data: teams,
  })
}

export const listTeamMembers: RequestHandler = async (req, res) => {
  const teamId = req.params.teamId

  if (typeof teamId !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Invalid team ID',
    })
    return
  }

  const members = await getTeamMembers(teamId)

  res.status(200).json({
    success: true,
    data: members,
  })
}

export const addTeamMember: RequestHandler = async (req, res) => {
  const teamId = req.params.teamId

  if (typeof teamId !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Invalid team ID',
    })
    return
  }

  const input = req.body as AddTeamMemberInput

  // Admins can add members, but cannot appoint other admins.
  if (req.teamRole === 'admin' && input.role === 'admin') {
    res.status(403).json({
      success: false,
      message: 'Only the team owner can appoint admins',
    })
    return
  }

  const member = await addTeamMemberService(teamId, input)

  res.status(201).json({
    success: true,
    message: 'Team member added successfully',
    data: member,
  })
}

export const removeTeamMember: RequestHandler = async (req, res) => {
  const { teamId, userId } = req.params

  if (typeof teamId !== 'string' || typeof userId !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Invalid team member identifiers',
    })
    return
  }

  if (req.teamRole !== 'owner' && req.teamRole !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to remove team members',
    })
    return
  }

  const result = await removeTeamMemberService(
    teamId,
    userId,
    req.teamRole,
  )

  res.status(200).json({
    success: true,
    ...result,
  })
}

