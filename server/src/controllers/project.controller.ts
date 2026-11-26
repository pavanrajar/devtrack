
import { RequestHandler } from 'express'
import {
  createProject as createProjectService,
  getTeamProjects,
  getProjectById,
  updateProject as updateProjectService,
  archiveProject as archiveProjectService,
  getProjectMembers,
  addProjectMember as addProjectMemberService,
  removeProjectMember as removeProjectMemberService,
} from '../services/project.service'
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectMemberInput,
} from '../validators/project.validator'

export const createProject: RequestHandler = async (req, res) => {
  const project = await createProjectService(
    req.params.teamId as string,
    req.user!.id,
    req.body as CreateProjectInput,
  )

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: project,
  })
}

export const listTeamProjects: RequestHandler = async (req, res) => {
  const projects = await getTeamProjects(
    req.params.teamId as string,
    req.user!.id,
  )

  res.status(200).json({
    success: true,
    data: projects,
  })
}

export const getProject: RequestHandler = async (req, res) => {
  const project = await getProjectById(
    req.params.projectId as string,
    req.user!.id,
  )

  res.status(200).json({
    success: true,
    data: project,
  })
}

export const updateProject: RequestHandler = async (req, res) => {
  const project = await updateProjectService(
    req.params.projectId as string,
    req.user!.id,
    req.body as UpdateProjectInput,
  )

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: project,
  })
}

export const archiveProject: RequestHandler = async (req, res) => {
  const project = await archiveProjectService(
    req.params.projectId as string,
    req.user!.id,
  )

  res.status(200).json({
    success: true,
    message: 'Project archived successfully',
    data: project,
  })
}

export const listProjectMembers: RequestHandler = async (req, res) => {
  const members = await getProjectMembers(
    req.params.projectId as string,
    req.user!.id,
  )

  res.status(200).json({
    success: true,
    data: members,
  })
}

export const addProjectMember: RequestHandler = async (req, res) => {
  const member = await addProjectMemberService(
    req.params.projectId as string,
    req.user!.id,
    req.body as AddProjectMemberInput,
  )

  res.status(201).json({
    success: true,
    message: 'Project member added successfully',
    data: member,
  })
}

export const removeProjectMember: RequestHandler = async (req, res) => {
  const result = await removeProjectMemberService(
    req.params.projectId as string,
    req.params.userId as string,
    req.user!.id,
  )

  res.status(200).json({
    success: true,
    ...result,
  })
}
