import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { pool } from '../src/config/database'
import { seedDemoData } from '../src/scripts/seed'
import { getAuthCookie } from './helpers/auth-cookie'

describe('Demo database seed', () => {
  it('creates reusable demo records and supports demo login', async () => {
    const client = await pool.connect()
    let firstRun
    let secondRun
    try {
      firstRun = await seedDemoData(client, 'DevTrack@123')
      secondRun = await seedDemoData(client, 'DevTrack@123')
    } finally {
      client.release()
    }

    expect(firstRun.users.created).toBe(9)
    expect(firstRun.teams.created).toBe(3)
    expect(firstRun.projects.created).toBe(5)
    expect(firstRun.tasks.created).toBe(45)
    expect(firstRun.comments.created).toBe(15)
    expect(secondRun.users.created).toBe(0)
    expect(secondRun.teams.created).toBe(0)
    expect(secondRun.projects.created).toBe(0)
    expect(secondRun.tasks.created).toBe(0)
    expect(secondRun.comments.created).toBe(0)

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@devtrack.local', password: 'DevTrack@123' })

    expect(login.status).toBe(200)
    expect(login.body.data.user.email).toBe('demo@devtrack.local')
    const teamResult = await pool.query<{ id: string }>(
      `SELECT t.id
       FROM teams t
       INNER JOIN team_members tm ON tm.team_id = t.id
       INNER JOIN users u ON u.id = tm.user_id
       WHERE t.name = 'Engineering Team' AND u.email = 'demo@devtrack.local'`,
    )
    expect(teamResult.rows).toHaveLength(1)

    const dashboard = await request(app)
      .get(`/api/teams/${teamResult.rows[0].id}/dashboard`)
      .set('Cookie', getAuthCookie(login.headers['set-cookie']))
    expect(dashboard.status, JSON.stringify(dashboard.body)).toBe(200)
    expect(dashboard.body.data.summary).toMatchObject({
      totalProjects: 3,
      totalTasks: 27,
      completedTasks: 14,
    })

    const counts = await pool.query<{
      users: string
      teams: string
      projects: string
      tasks: string
      comments: string
      invalid_assignees: string
      invalid_project_members: string
    }>(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM teams) AS teams,
        (SELECT COUNT(*) FROM projects) AS projects,
        (SELECT COUNT(*) FROM tasks) AS tasks,
        (SELECT COUNT(*) FROM task_comments) AS comments,
        (SELECT COUNT(*) FROM tasks task
         LEFT JOIN project_members member
           ON member.project_id = task.project_id
          AND member.user_id = task.assigned_to
         WHERE task.assigned_to IS NOT NULL AND member.user_id IS NULL
        ) AS invalid_assignees,
        (SELECT COUNT(*) FROM project_members member
         LEFT JOIN team_members team_member
           ON team_member.team_id = (
             SELECT project.team_id FROM projects project
             WHERE project.id = member.project_id
           )
          AND team_member.user_id = member.user_id
         WHERE team_member.user_id IS NULL
        ) AS invalid_project_members
    `)

    expect(counts.rows[0]).toEqual({
      users: '9',
      teams: '3',
      projects: '5',
      tasks: '45',
      comments: '15',
      invalid_assignees: '0',
      invalid_project_members: '0',
    })
  })

  it('refuses to seed production or an unapproved test database', async () => {
    const client = await pool.connect()
    try {
      await expect(
        seedDemoData(client, 'DevTrack@123', 'production', 'devtrack'),
      ).rejects.toThrow('development or test')
      await expect(
        seedDemoData(client, 'DevTrack@123', 'test', 'devtrack'),
      ).rejects.toThrow('devtrack_test')
    } finally {
      client.release()
    }
  })
})
