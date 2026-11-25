
import { Request, Response, NextFunction } from 'express'
import {
  createComment as createCommentService,
  getTaskComments,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
} from '../services/comment.service'

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const comment = await createCommentService(
      req.params.taskId as string,
      req.user!.id,
      req.body,
    )

    res.status(201).json({ success: true, data: comment })
  } catch (error) {
    next(error)
  }
}

export const listTaskComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const comments = await getTaskComments(
      req.params.taskId as string,
      req.user!.id,
    )

    res.status(200).json({ success: true, data: comments })
  } catch (error) {
    next(error)
  }
}

export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const comment = await updateCommentService(
      req.params.commentId as string,
      req.user!.id,
      req.body.content,
    )

    res.status(200).json({ success: true, data: comment })
  } catch (error) {
    next(error)
  }
}

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await deleteCommentService(
      req.params.commentId as string,
      req.user!.id,
    )

    res.status(200).json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}
