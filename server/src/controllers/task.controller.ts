
import { Request, Response, NextFunction } from 'express'
import {
  createTask as createTaskService,
  getProjectTasks,
  getTaskById,
  updateTask as updateTaskService,
  updateTaskStatus as updateTaskStatusService,
  assignTask as assignTaskService,
  deleteTask as deleteTaskService,
} from '../services/task.service'

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const task = await createTaskService(
      req.params.projectId as string,
      req.user!.id,
      req.body,
    )
    res.status(201).json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
}

export const listProjectTasks = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tasks = await getProjectTasks(
      req.params.projectId as string,
      req.user!.id,
    )
    res.status(200).json({ success: true, data: tasks })
  } catch (error) {
    next(error)
  }
}

export const getTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const task = await getTaskById(
      req.params.taskId as string,
      req.user!.id,
    )
    res.status(200).json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
}

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const task = await updateTaskService(
      req.params.taskId as string,
      req.user!.id,
      req.body,
    )
    res.status(200).json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
}

export const updateTaskStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const task = await updateTaskStatusService(
      req.params.taskId as string,
      req.user!.id,
      req.body.status,
    )
    res.status(200).json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
}

export const assignTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const task = await assignTaskService(
      req.params.taskId as string,
      req.user!.id,
      req.body.assignedTo,
    )
    res.status(200).json({ success: true, data: task })
  } catch (error) {
    next(error)
  }
}

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await deleteTaskService(
      req.params.taskId as string,
      req.user!.id,
    )
    res.status(200).json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}
