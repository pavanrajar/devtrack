
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { getAuthToken } from './helpers/auth-cookie'

const registerUser = async (email: string) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Team Test User',
      email,
      password: 'TestPassword@123',
    })

  return getAuthToken(response.headers['set-cookie'])
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

  it('should allow the owner to remove a regular team member', async () => {
    const ownerToken = await registerUser('removeowner@teamtest.local')
    const memberToken = await registerUser('removemember@teamtest.local')
    const teamResponse = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Removal Test Team' })
    const teamId = teamResponse.body.data.id as string
    const memberProfile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)
    const memberId = memberProfile.body.data.id as string

    await request(app)
      .post(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'removemember@teamtest.local', role: 'member' })

    const response = await request(app)
      .delete(`/api/teams/${teamId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(response.status).toBe(200)
    const listResponse = await request(app)
      .get(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
    expect(listResponse.body.data).toHaveLength(1)
  })

  it('should prevent removing the team owner', async () => {
    const ownerToken = await registerUser('protectowner@teamtest.local')
    const teamResponse = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Owner Protection Team' })
    const teamId = teamResponse.body.data.id as string
    const ownerProfile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ownerToken}`)
    const ownerId = ownerProfile.body.data.id as string

    const response = await request(app)
      .delete(`/api/teams/${teamId}/members/${ownerId}`)
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(response.status).toBe(409)
    expect(response.body.success).toBe(false)
  })

  it('should block team removal while the member has assigned tasks', async () => {
    const ownerToken = await registerUser('assignedowner@teamtest.local')
    const memberToken = await registerUser('assignedmember@teamtest.local')
    const teamResponse = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Assigned Work Team' })
    const teamId = teamResponse.body.data.id as string

    await request(app)
      .post(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'assignedmember@teamtest.local', role: 'member' })

    const projectResponse = await request(app)
      .post(`/api/teams/${teamId}/projects`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Assigned Work Project' })
    const projectId = projectResponse.body.data.id as string
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'assignedmember@teamtest.local' })

    const memberProfile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)
    const memberId = memberProfile.body.data.id as string
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Assigned task', assignedTo: memberId })

    const response = await request(app)
      .delete(`/api/teams/${teamId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(response.status).toBe(409)
    expect(response.body.success).toBe(false)
  })
})
