
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { pool } from '../src/config/database'

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
    expect(response.body.data.token).toBeDefined()
    expect(response.body.data.user.id).toBeDefined()
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
    expect(response.body.data.token).toBeDefined()
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

    const token = loginResponse.body.data.token

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.email).toBe(testUser.email)
  })
})
