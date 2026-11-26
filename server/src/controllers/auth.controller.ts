
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
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getAuthCookieValue,
  setAuthCookie,
} from '../utils/auth-cookie'

export const register: RequestHandler = async (req, res) => {
  const result = await registerUser(req.body as RegisterInput)
  setAuthCookie(res, result.token)

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user: result.user },
  })
}

export const login: RequestHandler = async (req, res) => {
  const result = await loginUser(req.body as LoginInput)
  setAuthCookie(res, result.token)

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user: result.user },
  })
}

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions())
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
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

  const cookieToken = getAuthCookieValue(req.headers.cookie)
  const authorization = req.headers.authorization
  if (!cookieToken && authorization?.startsWith('Bearer ')) {
    setAuthCookie(res, authorization.slice(7))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
}
