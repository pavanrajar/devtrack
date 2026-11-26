
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { pool } from '../src/config/database'
import { env } from '../src/config/env'
import { getAuthCookieOptions } from '../src/utils/auth-cookie'
import { getAuthCookie, getAuthToken } from './helpers/auth-cookie'

const testUser = {
  fullName: 'Test User',
  email: 'testuser@devtrack.local',
  password: 'TestPassword@123',
}

describe('Authentication API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.token).toBeUndefined()
    expect(response.body.data.user.id).toBeDefined()
    expect(getAuthCookie(response.headers['set-cookie'])).toContain('=')
  })

  it('should store the password as a bcrypt hash', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser)

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [testUser.email],
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].password_hash).not.toBe(testUser.password)
    expect(result.rows[0].password_hash).toMatch(/^\$2[aby]\$/)
  })

  it('should login with valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser)

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.token).toBeUndefined()
    expect(getAuthCookie(response.headers['set-cookie'])).toContain('=')
  })

  it('should reject invalid login credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123',
      })

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  it('should reject access to /me without a token', async () => {
    const response = await request(app)
      .get('/api/auth/me')

    expect(response.status).toBe(401)
  })

  it('should return the authenticated user from /me', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser)

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })

    const token = getAuthToken(loginResponse.headers['set-cookie'])

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.email).toBe(testUser.email)
    expect(response.headers['set-cookie'][0]).toContain(
      `devtrack_session=${token}`,
    )
  })

  it('uses an HttpOnly cookie session and rejects cross-origin mutations', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
    const cookie = getAuthCookie(response.headers['set-cookie'])
    const authCookieHeader = response.headers['set-cookie'].find(
      (value: string) => value.startsWith('devtrack_session='),
    )

    expect(authCookieHeader).toContain('HttpOnly')
    expect(authCookieHeader).toContain('SameSite=Strict')
    expect(authCookieHeader).toContain('Path=/api')

    const profile = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie)
    expect(profile.status).toBe(200)

    const blockedMutation = await request(app)
      .post('/api/teams')
      .set('Cookie', cookie)
      .set('Origin', 'https://attacker.example')
      .send({ name: 'Blocked Team' })
    expect(blockedMutation.status).toBe(403)

    const allowedMutation = await request(app)
      .post('/api/teams')
      .set('Cookie', cookie)
      .set('Origin', env.CLIENT_URL)
      .send({ name: 'Allowed Team' })
    expect(allowedMutation.status).toBe(201)

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .set('Origin', env.CLIENT_URL)
    expect(logout.status).toBe(200)
    expect(logout.headers['set-cookie'][0]).toContain('devtrack_session=;')
  })

  it('defaults session cookies to Secure in production', () => {
    expect(getAuthCookieOptions('production', undefined).secure).toBe(true)
    expect(getAuthCookieOptions('development', undefined).secure).toBe(false)
  })
})
