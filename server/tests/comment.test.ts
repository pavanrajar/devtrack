
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app'

const registerUser = async (email: string): Promise<string> => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Comment Test User',
      email,
      password: 'TestPassword@123',
    })

  return response.body.data.token as string
}

const createTeam = async (token: string): Promise<string> => {
  const response = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Comment Test Team' })

  return response.body.data.id as string
}

const createProject = async (
  token: string,
  teamId: string,
): Promise<string> => {
  const response = await request(app)
    .post(`/api/teams/${teamId}/projects`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Comment Test Project' })

  return response.body.data.id as string
}

const createTask = async (
  token: string,
  projectId: string,
): Promise<string> => {
  const response = await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Comment Test Task' })

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

const addProjectMember = async (
  managerToken: string,
  projectId: string,
  email: string,
) => {
  return request(app)
    .post(`/api/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ email })
}

describe('Comment API', () => {
  it('should create a comment on a task', async () => {
    const token = await registerUser('createcomment@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)
    const taskId = await createTask(token, projectId)

    const response = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'This is my first comment' })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.content).toBe('This is my first comment')
    expect(response.body.data.task_id).toBe(taskId)
    expect(response.body.data.id).toBeDefined()
  })

  it('should list comments belonging to a task', async () => {
    const token = await registerUser('listcomments@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)
    const taskId = await createTask(token, projectId)

    await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'First comment' })

    await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Second comment' })

    const response = await request(app)
      .get(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveLength(2)
    expect(response.body.data[0].content).toBe('First comment')
    expect(response.body.data[1].content).toBe('Second comment')
  })

  it('should allow a comment author to update their comment', async () => {
    const token = await registerUser('updatecomment@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)
    const taskId = await createTask(token, projectId)

    const commentResponse = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Original comment' })

    const commentId = commentResponse.body.data.id

    const response = await request(app)
      .patch(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated comment' })

    expect(response.status).toBe(200)
    expect(response.body.data.content).toBe('Updated comment')
  })

  it('should prevent another user from updating a comment', async () => {
    const authorToken = await registerUser('commentauthor@test.local')
    const otherToken = await registerUser('commentother@test.local')

    const teamId = await createTeam(authorToken)
    await addTeamMember(authorToken, teamId, 'commentother@test.local')

    const projectId = await createProject(authorToken, teamId)
    await addProjectMember(
      authorToken,
      projectId,
      'commentother@test.local',
    )

    const taskId = await createTask(authorToken, projectId)

    const commentResponse = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ content: 'Author comment' })

    const commentId = commentResponse.body.data.id

    const response = await request(app)
      .patch(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'Unauthorized edit' })

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })

  it('should allow a comment author to delete their comment', async () => {
    const token = await registerUser('deletecomment@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)
    const taskId = await createTask(token, projectId)

    const commentResponse = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comment to delete' })

    const commentId = commentResponse.body.data.id

    const response = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)

    const commentsResponse = await request(app)
      .get(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)

    expect(commentsResponse.body.data).toHaveLength(0)
  })

  it('should prevent another user from deleting a comment', async () => {
    const authorToken = await registerUser('deleteauthor@test.local')
    const otherToken = await registerUser('deleteother@test.local')

    const teamId = await createTeam(authorToken)
    await addTeamMember(authorToken, teamId, 'deleteother@test.local')

    const projectId = await createProject(authorToken, teamId)
    await addProjectMember(
      authorToken,
      projectId,
      'deleteother@test.local',
    )

    const taskId = await createTask(authorToken, projectId)

    const commentResponse = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ content: 'Protected comment' })

    const commentId = commentResponse.body.data.id

    const response = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })

  it('should reject comments from users without project access', async () => {
    const ownerToken = await registerUser('commentowner@test.local')
    const outsiderToken = await registerUser('commentoutsider@test.local')

    const teamId = await createTeam(ownerToken)
    const projectId = await createProject(ownerToken, teamId)
    const taskId = await createTask(ownerToken, projectId)

    const response = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ content: 'Unauthorized comment' })

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })

  it('should reject empty comment content', async () => {
    const token = await registerUser('emptycomment@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)
    const taskId = await createTask(token, projectId)

    const response = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '   ' })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('should reject comments exceeding 5000 characters', async () => {
    const token = await registerUser('longcomment@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)
    const taskId = await createTask(token, projectId)

    const response = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'a'.repeat(5001) })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('should return 404 when commenting on a nonexistent task', async () => {
    const token = await registerUser('missingcommenttask@test.local')

    const response = await request(app)
      .post('/api/tasks/00000000-0000-4000-8000-000000000001/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test comment' })

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })
})
