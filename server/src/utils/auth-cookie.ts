import type { CookieOptions, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export const AUTH_COOKIE_NAME = 'devtrack_session'

type NodeEnvironment = 'development' | 'production' | 'test'

export const getAuthCookieValue = (cookieHeader?: string): string | null => {
  if (!cookieHeader) return null

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`))

  return cookie?.slice(AUTH_COOKIE_NAME.length + 1) || null
}

export const getAuthCookieOptions = (
  nodeEnvironment: NodeEnvironment = env.NODE_ENV,
  cookieSecure: 'true' | 'false' | undefined = env.COOKIE_SECURE,
): CookieOptions => ({
  httpOnly: true,
  secure: cookieSecure === undefined
    ? nodeEnvironment === 'production'
    : cookieSecure === 'true',
  sameSite: 'strict',
  path: '/api',
})

export const setAuthCookie = (response: Response, token: string): void => {
  const decoded = jwt.decode(token)
  const maxAge =
    decoded && typeof decoded !== 'string' && typeof decoded.exp === 'number'
      ? Math.max(decoded.exp * 1000 - Date.now(), 0)
      : undefined

  response.cookie(AUTH_COOKIE_NAME, token, {
    ...getAuthCookieOptions(),
    ...(maxAge === undefined ? {} : { maxAge }),
  })
}
