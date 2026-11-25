
import { RequestHandler } from 'express'
import { z } from 'zod'

const validateUuidParam = (paramName: string): RequestHandler => {
  return (req, res, next) => {
    const value = req.params[paramName]

    const result = z.string().uuid().safeParse(value)

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: `Invalid ${paramName}`,
      })
      return
    }

    next()
  }
}

export default validateUuidParam
