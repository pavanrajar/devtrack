
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app'

const registerUser = async (email: string) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Team Test User',
      email,
      password: 'TestPassword@123',
    })

  return response.body.data.token as string
}

describe('Team API', () => {
  it('should create a team and assign the creator as owner', async () => {
    const token = await registerUser('owner@teamtest.local')

    const response = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Engineering Team',
        description: 'Team API integration testing',
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBeDefined()
  })

  it('should list teams belonging to the authenticated user', async () => {
    const token = await registerUser('listowner@teamtest.local')

    await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Listing Test Team' })

    const response = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].name).toBe('Listing Test Team')
  })

  it('should allow the owner to add a team member', async () => {
    const ownerToken = await registerUser('owner2@teamtest.local')

    await registerUser('member@teamtest.local')

    const teamResponse = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Member Test Team' })

    const teamId = teamResponse.body.data.id

    const response = await request(app)
      .post(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: 'member@teamtest.local',
        role: 'member',
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.role).toBe('member')
  })

  it('should prevent ordinary members from adding team members', async () => {
    const ownerToken = await registerUser('owner3@teamtest.local')
    const memberToken = await registerUser('member2@teamtest.local')
    await registerUser('target@teamtest.local')

    const teamResponse = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Authorization Test Team' })

    const teamId = teamResponse.body.data.id

    await request(app)
      .post(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: 'member2@teamtest.local',
        role: 'member',
      })

    const response = await request(app)
      .post(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        email: 'target@teamtest.local',
        role: 'member',
      })

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
  })
})
