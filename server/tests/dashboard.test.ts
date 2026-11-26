import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { getAuthToken } from './helpers/auth-cookie'

const registerUser = async (email: string): Promise<string> => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Dashboard Test User',
      email,
      password: 'TestPassword@123',
    })
  return getAuthToken(response.headers['set-cookie'])
}

describe('Team dashboard API', () => {
  it('returns live task, project, priority, and comment metrics', async () => {
    const token = await registerUser('dashboardowner@test.local')
    const teamResponse = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dashboard Test Team' })
    const teamId = teamResponse.body.data.id as string

    const projectResponse = await request(app)
      .post(`/api/teams/${teamId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dashboard Test Project' })
    const projectId = projectResponse.body.data.id as string

    const profileResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    const userId = profileResponse.body.data.id as string

    const activeTaskResponse = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Task in progress',
        priority: 'high',
        assignedTo: userId,
      })
    const activeTaskId = activeTaskResponse.body.data.id as string
    await request(app)
      .patch(`/api/tasks/${activeTaskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })
    await request(app)
      .post(`/api/tasks/${activeTaskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Implementation is ready for review.' })

    const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Overdue backlog task',
        priority: 'urgent',
        dueDate: overdueDate,
      })

    const response = await request(app)
      .get(`/api/teams/${teamId}/dashboard`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status, JSON.stringify(response.body)).toBe(200)
    expect(response.body.data.summary).toMatchObject({
      totalProjects: 1,
      activeProjects: 1,
      totalTasks: 2,
      pendingTasks: 1,
      inProgressTasks: 1,
      overdueTasks: 1,
      assignedToMe: 1,
    })
    expect(response.body.data.projects[0]).toMatchObject({
      id: projectId,
      totalTasks: 2,
      completedTasks: 0,
      progress: 0,
    })
    expect(response.body.data.tasksByPriority).toContainEqual({
      priority: 'urgent',
      count: 1,
    })
    expect(response.body.data.recentActivity[0]).toMatchObject({
      task_id: activeTaskId,
      author_name: 'Dashboard Test User',
      content: 'Implementation is ready for review.',
    })
  })

  it('does not expose projects unavailable to an ordinary team member', async () => {
    const ownerToken = await registerUser('dashboardprojectowner@test.local')
    const memberToken = await registerUser('dashboardprojectmember@test.local')
    const teamResponse = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Dashboard Access Team' })
    const teamId = teamResponse.body.data.id as string

    await request(app)
      .post(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'dashboardprojectmember@test.local' })
    await request(app)
      .post(`/api/teams/${teamId}/projects`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Private Dashboard Project' })

    const response = await request(app)
      .get(`/api/teams/${teamId}/dashboard`)
      .set('Authorization', `Bearer ${memberToken}`)

    expect(response.status, JSON.stringify(response.body)).toBe(200)
    expect(response.body.data.summary.totalProjects).toBe(0)
    expect(response.body.data.summary.totalTasks).toBe(0)
  })
})
