
import { RequestHandler } from 'express'
import {
  registerUser,
  loginUser,
  getUserById,
} from '../services/auth.service'
import {
  RegisterInput,
  LoginInput,
} from '../validators/auth.validator'

export const register: RequestHandler = async (req, res) => {
  const result = await registerUser(req.body as RegisterInput)

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: result,
  })
}

export const login: RequestHandler = async (req, res) => {
  const result = await loginUser(req.body as LoginInput)

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  })
}

export const me: RequestHandler = async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    })
    return
  }

  const user = await getUserById(userId)

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'User account no longer exists',
    })
    return
  }

  res.status(200).json({
    success: true,
    data: user,
  })
}
