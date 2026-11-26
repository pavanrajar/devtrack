
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { getAuthToken } from './helpers/auth-cookie'

const registerUser = async (email: string): Promise<string> => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Task Test User',
      email,
      password: 'TestPassword@123',
    })

  return getAuthToken(response.headers['set-cookie'])
}

const createTeam = async (token: string): Promise<string> => {
  const response = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Task Test Team' })

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
): Promise<string> => {
  const response = await request(app)
    .post(`/api/teams/${teamId}/projects`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Task Test Project' })

  return response.body.data.id as string
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

const createTask = async (
  token: string,
  projectId: string,
  title = 'Test Task',
) => {
  return request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title })
}

describe('Task API', () => {
  it('should create a task with default priority and status', async () => {
    const token = await registerUser('createtask@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)

    const response = await createTask(token, projectId)

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.title).toBe('Test Task')
    expect(response.body.data.priority).toBe('medium')
    expect(response.body.data.status).toBe('backlog')
    expect(response.body.data.id).toBeDefined()
  })

  it('should reject task creation by users without project access', async () => {
    const ownerToken = await registerUser('taskowner@test.local')
    const outsiderToken = await registerUser('taskoutsider@test.local')

    const teamId = await createTeam(ownerToken)
    const projectId = await createProject(ownerToken, teamId)

    const response = await createTask(outsiderToken, projectId)

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })

  it('should reject task creation with an invalid assignee', async () => {
    const token = await registerUser('invalidassignee@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)

    const response = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Invalid Assignment',
        assignedTo: '00000000-0000-4000-8000-000000000001',
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('should list tasks belonging to a project', async () => {
    const token = await registerUser('listtasks@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)

    await createTask(token, projectId, 'First Task')
    await createTask(token, projectId, 'Second Task')

    const response = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveLength(2)
  })

  it('should retrieve an individual task', async () => {
    const token = await registerUser('gettask@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)

    const taskResponse = await createTask(token, projectId)
    const taskId = taskResponse.body.data.id

    const response = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.data.id).toBe(taskId)
    expect(response.body.data.title).toBe('Test Task')
  })

  it('should return 404 for a task that does not exist', async () => {
    const token = await registerUser('missingtask@test.local')

    const response = await request(app)
      .get('/api/tasks/00000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })

  it('should allow a project member to update task details', async () => {
    const token = await registerUser('updatetask@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)

    const taskResponse = await createTask(token, projectId)
    const taskId = taskResponse.body.data.id

    const response = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Task',
        description: 'Updated description',
        priority: 'high',
      })

    expect(response.status).toBe(200)
    expect(response.body.data.title).toBe('Updated Task')
    expect(response.body.data.description).toBe('Updated description')
    expect(response.body.data.priority).toBe('high')
  })

  it('should allow a project member to update task status', async () => {
    const token = await registerUser('statustask@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)

    const taskResponse = await createTask(token, projectId)
    const taskId = taskResponse.body.data.id

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })

    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('in_progress')
  })

  it('should reject an invalid task status', async () => {
    const token = await registerUser('invalidstatus@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)

    const taskResponse = await createTask(token, projectId)
    const taskId = taskResponse.body.data.id

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  
  it('should allow a project manager to assign a task to a project member', async () => {
    const managerToken = await registerUser('assignmanager@test.local')
    await registerUser('assigntarget@test.local')

    const teamId = await createTeam(managerToken)
    await addTeamMember(managerToken, teamId, 'assigntarget@test.local')

    const projectId = await createProject(managerToken, teamId)
    await addProjectMember(
      managerToken,
      projectId,
      'assigntarget@test.local',
    )

    const taskResponse = await createTask(managerToken, projectId)
    const taskId = taskResponse.body.data.id

    const memberResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'assigntarget@test.local',
        password: 'TestPassword@123',
      })

    expect(memberResponse.status).toBe(200)

    // Get the member's ID from their authenticated profile.
    const profileResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${getAuthToken(memberResponse.headers['set-cookie'])}`)

    const memberId = profileResponse.body.data.id

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ assignedTo: memberId })

    expect(response.status).toBe(200)
    expect(response.body.data.assigned_to).toBe(memberId)
  })


  it('should prevent ordinary project members from assigning tasks', async () => {
    const managerToken = await registerUser('assignowner@test.local')
    const memberToken = await registerUser('assignmember@test.local')

    const teamId = await createTeam(managerToken)
    await addTeamMember(managerToken, teamId, 'assignmember@test.local')

    const projectId = await createProject(managerToken, teamId)
    await addProjectMember(
      managerToken,
      projectId,
      'assignmember@test.local',
    )

    const taskResponse = await createTask(managerToken, projectId)
    const taskId = taskResponse.body.data.id

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ assignedTo: null })

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
  })

  it('should allow a project manager to unassign a task', async () => {
    const token = await registerUser('unassigntask@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)

    const taskResponse = await createTask(token, projectId)
    const taskId = taskResponse.body.data.id

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assignedTo: null })

    expect(response.status).toBe(200)
    expect(response.body.data.assigned_to).toBeNull()
  })

  it('should allow a project manager to delete a task', async () => {
    const token = await registerUser('deletetask@test.local')
    const teamId = await createTeam(token)
    const projectId = await createProject(token, teamId)

    const taskResponse = await createTask(token, projectId)
    const taskId = taskResponse.body.data.id

    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)

    const deletedTask = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(deletedTask.status).toBe(404)
  })

  it('should prevent ordinary project members from deleting tasks', async () => {
    const managerToken = await registerUser('deleteowner@test.local')
    const memberToken = await registerUser('deletemember@test.local')

    const teamId = await createTeam(managerToken)
    await addTeamMember(managerToken, teamId, 'deletemember@test.local')

    const projectId = await createProject(managerToken, teamId)
    await addProjectMember(
      managerToken,
      projectId,
      'deletemember@test.local',
    )

    const taskResponse = await createTask(managerToken, projectId)
    const taskId = taskResponse.body.data.id

    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`)

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
  })
})
