
import { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { getAuthCookieValue } from '../utils/auth-cookie'

const authenticate: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization
  const cookieToken = getAuthCookieValue(req.headers.cookie)
  const bearerToken =
    authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : null

  const token = cookieToken ?? bearerToken
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication is required',
    })
    return
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)

    if (typeof decoded === 'string' || !decoded.sub) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      })
      return
    }

    req.user = {
      id: decoded.sub,
    }

    next()
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    })
  }
}

export default authenticate
