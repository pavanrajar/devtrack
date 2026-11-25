
import { RequestHandler } from 'express'
import { z } from 'zod'

const validate = (schema: z.ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const error = new Error(
        result.error.issues
          .map((issue) => {
            const field = issue.path.join('.')
            return `${field}: ${issue.message}`
          })
          .join(', '),
      ) as Error & { statusCode: number }

      error.statusCode = 400

      return next(error)
    }

    req.body = result.data
    next()
  }
}

export default validate
