
import { ErrorRequestHandler } from 'express'
import { env } from '../config/env'

const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  const statusCode =
    typeof error.statusCode === 'number'
      ? error.statusCode
      : 500

  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : error.message || 'Something went wrong'

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && {
      stack: error.stack,
    }),
  })
}

export default errorHandler
