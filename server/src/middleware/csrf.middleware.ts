import type { RequestHandler } from 'express'
import { env } from '../config/env'
import { getAuthCookieValue } from '../utils/auth-cookie'

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const isAllowedOrigin = (origin: string): boolean => {
  try {
    return new URL(origin).origin === new URL(env.CLIENT_URL).origin
  } catch {
    return false
  }
}

const csrfProtection: RequestHandler = (req, res, next) => {
  if (
    !mutatingMethods.has(req.method) ||
    !getAuthCookieValue(req.headers.cookie)
  ) {
    next()
    return
  }

  const origin = req.get('origin')
  if (!origin || !isAllowedOrigin(origin)) {
    res.status(403).json({
      success: false,
      message: 'Request origin is not allowed',
    })
    return
  }

  next()
}

export default csrfProtection
