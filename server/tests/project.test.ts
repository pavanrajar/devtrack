
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app'

const registerUser = async (email: string): Promise<string> => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Project Test User',
      email,
      password: 'TestPassword@123',
    })

  return response.body.data.token as string
}

const createTeam = async (
  token: string,
  name = 'Project Test Team',
): Promise<string> => {
  const response = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${token}`)
    .send({ name })

  return response.body.data.id as string
}

const addTeamMember = async (
  ownerToken: string,
  teamId: string,
  email: string,
) => {
  return request(app)
    .post(`/api/teams/${teamId}/members`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ email, role: 'member' })
}

const createProject = async (
  token: string,
  teamId: string,
  name = 'Project Test',
) => {
  return request(app)
    .post(`/api/teams/${teamId}/projects`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name, description: 'Project integration testing' })
}

describe('Project API', () => {
  it('should create a project and assign its creator as manager', async () => {
    const token = await registerUser('projectowner@test.local')
    const teamId = await createTeam(token)

    const response = await createProject(token, teamId)

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.name).toBe('Project Test')
    expect(response.body.data.projectRole).toBe('manager')
  })

  it('should prevent ordinary team members from creating projects', async () => {
    const ownerToken = await registerUser('createowner@test.local')
    const memberToken = await registerUser('createmember@test.local')

    const teamId = await createTeam(ownerToken)
    await addTeamMember(ownerToken, teamId, 'createmember@test.local')

    const response = await createProject(memberToken, teamId)

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
  })

  it('should list projects belonging to a team', async () => {
    const token = await registerUser('listproject@test.local')
    const teamId = await createTeam(token)

    await createProject(token, teamId, 'First Project')
    await createProject(token, teamId, 'Second Project')

    const response = await request(app)
      .get(`/api/teams/${teamId}/projects`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveLength(2)
  })

  it('should not list projects to which an ordinary team member has not been added', async () => {
    const ownerToken = await registerUser('listowner@test.local')
    const memberToken = await registerUser('listmember@test.local')

    const teamId = await createTeam(ownerToken)
    await addTeamMember(ownerToken, teamId, 'listmember@test.local')
    await createProject(ownerToken, teamId)

    const response = await request(app)
      .get(`/api/teams/${teamId}/projects`)
      .set('Authorization', `Bearer ${memberToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(0)
  })

  it('should retrieve an individual project', async () => {
    const token = await registerUser('getproject@test.local')
    const teamId = await createTeam(token)

    const projectResponse = await createProject(token, teamId)
    const projectId = projectResponse.body.data.id

    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.data.id).toBe(projectId)
    expect(response.body.data.name).toBe('Project Test')
    expect(response.body.data.projectRole).toBe('manager')
  })

  it('should prevent team members without project access from retrieving a project', async () => {
    const ownerToken = await registerUser('getowner@test.local')
    const memberToken = await registerUser('getmember@test.local')

    const teamId = await createTeam(ownerToken)
    await addTeamMember(ownerToken, teamId, 'getmember@test.local')

    const projectResponse = await createProject(ownerToken, teamId)
    const projectId = projectResponse.body.data.id

    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`)

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
  })

  it('should allow a project manager to update project details', async () => {
    const token = await registerUser('updateproject@test.local')
    const teamId = await createTeam(token)

    const projectResponse = await createProject(token, teamId)
    const projectId = projectResponse.body.data.id

    const response = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Project',
        description: 'Updated project description',
      })

    expect(response.status).toBe(200)
    expect(response.body.data.name).toBe('Updated Project')
    expect(response.body.data.description).toBe('Updated project description')
  })

  it('should prevent ordinary project members from updating projects', async () => {
    const ownerToken = await registerUser('updateowner@test.local')
    const memberToken = await registerUser('updatemember@test.local')

    const teamId = await createTeam(ownerToken)
    await addTeamMember(ownerToken, teamId, 'updatemember@test.local')

    const projectResponse = await createProject(ownerToken, teamId)
    const projectId = projectResponse.body.data.id

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'updatemember@test.local' })

    const response = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Unauthorized Update' })

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
  })

  it('should allow a project manager to add a team member to a project', async () => {
    const ownerToken = await registerUser('addmemberowner@test.local')
    await registerUser('newprojectmember@test.local')

    const teamId = await createTeam(ownerToken)
    await addTeamMember(
      ownerToken,
      teamId,
      'newprojectmember@test.local',
    )

    const projectResponse = await createProject(ownerToken, teamId)
    const projectId = projectResponse.body.data.id

    const response = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'newprojectmember@test.local' })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.email).toBe('newprojectmember@test.local')
    expect(response.body.data.role).toBe('member')
  })

  it('should reject users who are not members of the project team', async () => {
    const ownerToken = await registerUser('outsiderowner@test.local')
    await registerUser('outsider@test.local')

    const teamId = await createTeam(ownerToken)
    const projectResponse = await createProject(ownerToken, teamId)
    const projectId = projectResponse.body.data.id

    const response = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'outsider@test.local' })

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })

  it('should archive a project', async () => {
    const token = await registerUser('archiveproject@test.local')
    const teamId = await createTeam(token)

    const projectResponse = await createProject(token, teamId)
    const projectId = projectResponse.body.data.id

    const response = await request(app)
      .patch(`/api/projects/${projectId}/archive`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('archived')
  })

  it('should reject duplicate project names within the same team', async () => {
    const token = await registerUser('duplicateproject@test.local')
    const teamId = await createTeam(token)

    await createProject(token, teamId, 'Duplicate Project')

    const response = await createProject(
      token,
      teamId,
      'Duplicate Project',
    )

    expect(response.status).toBe(409)
    expect(response.body.success).toBe(false)
  })
})
