
import { ErrorRequestHandler } from 'express'
import { env } from '../config/env'

const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
) => {
  const statusCode =
    typeof error.statusCode === 'number'
      ? error.statusCode
      : 500

  if (statusCode >= 500) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined
    console.error('[api-error]', {
      method: req.method,
      path: req.path,
      name: error instanceof Error ? error.name : 'UnknownError',
      ...(code ? { code } : {}),
    })
  }

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
