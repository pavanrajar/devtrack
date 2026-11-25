
import { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

const authenticate: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization

  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication token is required',
    })
    return
  }

  const token = authorization.slice(7)

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
