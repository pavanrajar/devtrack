import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { PoolClient } from 'pg'
import { pool } from '../config/database'
import { env } from '../config/env'

const DEMO_EMAIL = 'demo@devtrack.local'
const DEMO_NAME = 'DevTrack Demo User'
const SALT_ROUNDS = 12
const UUID_NAMESPACE = '6859dfb1-6811-4d30-9b46-c77ea6ca4935'

type UserKey =
  | 'demo'
  | 'alex'
  | 'sarah'
  | 'michael'
  | 'emily'
  | 'daniel'
  | 'olivia'
  | 'james'
  | 'sophia'

type ProjectKey =
  | 'platform'
  | 'ecommerce'
  | 'mobile'
  | 'dashboard'
  | 'infrastructure'

type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

interface SeedUser {
  key: UserKey
  name: string
  email: string
}

interface SeedTeam {
  key: string
  name: string
  description: string
  members: Array<{ user: UserKey; role: 'owner' | 'admin' | 'member' }>
}

interface SeedProject {
  key: ProjectKey
  team: string
  name: string
  description: string
  status: 'active' | 'archived'
  members: Array<{ user: UserKey; role: 'manager' | 'member' }>
  taskTitles: string[]
}

interface Counts {
  created: number
  reused: number
}

export interface SeedSummary {
  users: Counts
  teams: Counts
  projects: Counts
  tasks: Counts
  comments: Counts
}

const users: SeedUser[] = [
  { key: 'demo', name: DEMO_NAME, email: DEMO_EMAIL },
  { key: 'alex', name: 'Alex Morgan', email: 'alex.morgan@devtrack.local' },
  { key: 'sarah', name: 'Sarah Johnson', email: 'sarah.johnson@devtrack.local' },
  { key: 'michael', name: 'Michael Chen', email: 'michael.chen@devtrack.local' },
  { key: 'emily', name: 'Emily Davis', email: 'emily.davis@devtrack.local' },
  { key: 'daniel', name: 'Daniel Wilson', email: 'daniel.wilson@devtrack.local' },
  { key: 'olivia', name: 'Olivia Brown', email: 'olivia.brown@devtrack.local' },
  { key: 'james', name: 'James Taylor', email: 'james.taylor@devtrack.local' },
  { key: 'sophia', name: 'Sophia Martinez', email: 'sophia.martinez@devtrack.local' },
]

const teams: SeedTeam[] = [
  {
    key: 'engineering',
    name: 'Engineering Team',
    description: 'Build and maintain the DevTrack product and platform.',
    members: [
      { user: 'demo', role: 'owner' },
      { user: 'alex', role: 'admin' },
      { user: 'sarah', role: 'member' },
      { user: 'michael', role: 'member' },
      { user: 'daniel', role: 'member' },
      { user: 'james', role: 'member' },
      { user: 'sophia', role: 'member' },
    ],
  },
  {
    key: 'product',
    name: 'Product Team',
    description: 'Plan product direction and deliver customer-focused features.',
    members: [
      { user: 'demo', role: 'owner' },
      { user: 'olivia', role: 'admin' },
      { user: 'alex', role: 'member' },
      { user: 'sarah', role: 'member' },
      { user: 'michael', role: 'member' },
      { user: 'sophia', role: 'member' },
    ],
  },
  {
    key: 'design',
    name: 'Design Team',
    description: 'Create consistent, accessible experiences across DevTrack.',
    members: [
      { user: 'demo', role: 'owner' },
      { user: 'emily', role: 'admin' },
      { user: 'sarah', role: 'member' },
      { user: 'olivia', role: 'member' },
      { user: 'sophia', role: 'member' },
    ],
  },
]

const projects: SeedProject[] = [
  {
    key: 'platform',
    team: 'engineering',
    name: 'DevTrack Platform Development',
    description: 'Deliver reliable project, team, and task management workflows.',
    status: 'active',
    members: [
      { user: 'demo', role: 'manager' },
      { user: 'alex', role: 'manager' },
      { user: 'sarah', role: 'member' },
      { user: 'michael', role: 'member' },
      { user: 'daniel', role: 'member' },
      { user: 'james', role: 'member' },
      { user: 'sophia', role: 'member' },
    ],
    taskTitles: [
      'Implement user authentication',
      'Design workspace dashboard UI',
      'Create task management board',
      'Build project management API',
      'Implement role-based permissions',
      'Write API integration tests',
      'Fix responsive navigation',
      'Improve application performance',
      'Configure Docker deployment',
    ],
  },
  {
    key: 'ecommerce',
    team: 'engineering',
    name: 'E-Commerce Website',
    description: 'Improve the shopping experience from product discovery to checkout.',
    status: 'active',
    members: [
      { user: 'demo', role: 'manager' },
      { user: 'alex', role: 'manager' },
      { user: 'sarah', role: 'member' },
      { user: 'michael', role: 'member' },
      { user: 'daniel', role: 'member' },
    ],
    taskTitles: [
      'Build searchable product catalog',
      'Implement shopping cart persistence',
      'Validate checkout form inputs',
      'Add inventory availability checks',
      'Fix responsive product navigation',
      'Cover checkout with integration tests',
      'Document payment provider integration',
      'Improve product search relevance',
      'Add storefront performance monitoring',
    ],
  },
  {
    key: 'mobile',
    team: 'product',
    name: 'Mobile Application Development',
    description: 'Deliver a focused mobile experience for project updates and task work.',
    status: 'active',
    members: [
      { user: 'demo', role: 'manager' },
      { user: 'olivia', role: 'manager' },
      { user: 'sarah', role: 'member' },
      { user: 'michael', role: 'member' },
      { user: 'sophia', role: 'member' },
    ],
    taskTitles: [
      'Create mobile sign-in screens',
      'Implement task list API integration',
      'Design offline state handling',
      'Add push notification preferences',
      'Optimize mobile workspace navigation',
      'Test task updates on small screens',
      'Add accessible touch targets',
      'Prepare mobile release checklist',
      'Review mobile analytics events',
    ],
  },
  {
    key: 'dashboard',
    team: 'design',
    name: 'Customer Dashboard Redesign',
    description: 'Make project health and team workload easier to understand.',
    status: 'active',
    members: [
      { user: 'demo', role: 'manager' },
      { user: 'emily', role: 'manager' },
      { user: 'sarah', role: 'member' },
      { user: 'olivia', role: 'member' },
      { user: 'sophia', role: 'member' },
    ],
    taskTitles: [
      'Map dashboard information hierarchy',
      'Design project progress components',
      'Prototype task status visualization',
      'Review accessible dashboard colors',
      'Build responsive dashboard layout',
      'Add loading and empty states',
      'Validate dashboard with product team',
      'Improve keyboard navigation',
      'Document dashboard component patterns',
    ],
  },
  {
    key: 'infrastructure',
    team: 'engineering',
    name: 'API Infrastructure Upgrade',
    description: 'Harden database performance, service reliability, and deployment workflows.',
    status: 'archived',
    members: [
      { user: 'demo', role: 'manager' },
      { user: 'james', role: 'manager' },
      { user: 'michael', role: 'member' },
      { user: 'alex', role: 'member' },
      { user: 'daniel', role: 'member' },
    ],
    taskTitles: [
      'Add PostgreSQL database indexes',
      'Optimize project task queries',
      'Configure authentication rate limits',
      'Standardize API request validation',
      'Improve structured server logging',
      'Document database migration process',
      'Automate container image builds',
      'Add backend integration test coverage',
      'Publish API operations runbook',
    ],
  },
]

const taskStatuses: TaskStatus[][] = [
  ['done', 'done', 'in_progress', 'in_progress', 'in_review', 'backlog', 'backlog', 'in_review', 'done'],
  ['done', 'in_progress', 'in_progress', 'in_review', 'backlog', 'backlog', 'done', 'in_review', 'backlog'],
  ['in_progress', 'in_review', 'backlog', 'backlog', 'in_progress', 'in_review', 'done', 'backlog', 'in_progress'],
  ['done', 'in_progress', 'in_review', 'backlog', 'in_progress', 'backlog', 'in_review', 'done', 'backlog'],
  ['done', 'done', 'done', 'done', 'done', 'done', 'done', 'done', 'done'],
]

const taskPriorities: TaskPriority[] = [
  'high',
  'medium',
  'urgent',
  'high',
  'medium',
  'low',
  'high',
  'medium',
  'urgent',
]

const dueOffsets = [-24, -12, -5, -1, 3, 7, 12, 17, 25]

const taskComments = [
  'The initial implementation is ready for a team review.',
  'I added the acceptance notes and linked the related work.',
  'This is unblocked; I will share the next update after verification.',
]

const emptyCounts = (): Counts => ({ created: 0, reused: 0 })

const deterministicUuid = (key: string) => {
  const namespace = Buffer.from(UUID_NAMESPACE.replace(/-/g, ''), 'hex')
  const hash = createHash('sha1').update(namespace).update(key).digest()
  hash[6] = (hash[6] & 0x0f) | 0x50
  hash[8] = (hash[8] & 0x3f) | 0x80
  const hex = hash.subarray(0, 16).toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const dateAtDayOffset = (offset: number) => {
  const date = new Date()
  date.setUTCHours(12, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString()
}

const assertSeedEnvironment = (nodeEnvironment: string, databaseName: string) => {
  if (nodeEnvironment !== 'development' && nodeEnvironment !== 'test') {
    throw new Error('Demo seeding is permitted only in development or test environments.')
  }

  if (nodeEnvironment === 'test' && databaseName !== 'devtrack_test') {
    throw new Error('Test seeding is limited to the devtrack_test database.')
  }
}

const ensureUser = async (
  client: PoolClient,
  user: SeedUser,
  demoPasswordHash: string,
  secondaryPasswordHash: string,
  counts: Counts,
) => {
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [user.email],
  )

  if (existing.rowCount) {
    if (user.key === 'demo') {
      await client.query(
        `UPDATE users
         SET full_name = $1, password_hash = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [user.name, demoPasswordHash, existing.rows[0].id],
      )
    }
    counts.reused += 1
    return existing.rows[0].id
  }

  const id = deterministicUuid(`user:${user.key}`)
  const passwordHash = user.key === 'demo' ? demoPasswordHash : secondaryPasswordHash
  await client.query(
    `INSERT INTO users (id, full_name, email, password_hash)
     VALUES ($1, $2, $3, $4)`,
    [id, user.name, user.email, passwordHash],
  )
  counts.created += 1
  return id
}

const ensureTeam = async (
  client: PoolClient,
  team: SeedTeam,
  demoUserId: string,
  counts: Counts,
) => {
  const deterministicId = deterministicUuid(`team:${team.key}`)
  const byId = await client.query<{ id: string; created_by: string }>(
    'SELECT id, created_by FROM teams WHERE id = $1',
    [deterministicId],
  )

  if (byId.rowCount) {
    if (byId.rows[0].created_by !== demoUserId) {
      throw new Error(`Seed team ID conflict for "${team.name}".`)
    }
    await client.query(
      `UPDATE teams
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [team.name, team.description, deterministicId],
    )
    counts.reused += 1
    return deterministicId
  }

  const byName = await client.query<{ id: string; created_by: string }>(
    `SELECT id, created_by
     FROM teams
     WHERE LOWER(name) = LOWER($1)
     ORDER BY created_at ASC
     LIMIT 1`,
    [team.name],
  )

  if (byName.rowCount) {
    if (byName.rows[0].created_by !== demoUserId) {
      throw new Error(
        `A team named "${team.name}" already exists outside the demo account; refusing to attach seed data to it.`,
      )
    }
    await client.query(
      `UPDATE teams
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [team.name, team.description, byName.rows[0].id],
    )
    counts.reused += 1
    return byName.rows[0].id
  }

  await client.query(
    `INSERT INTO teams (id, name, description, created_by)
     VALUES ($1, $2, $3, $4)`,
    [deterministicId, team.name, team.description, demoUserId],
  )
  counts.created += 1
  return deterministicId
}

const ensureProject = async (
  client: PoolClient,
  project: SeedProject,
  teamId: string,
  demoUserId: string,
  counts: Counts,
) => {
  const deterministicId = deterministicUuid(`project:${project.key}`)
  const byId = await client.query<{ id: string; created_by: string }>(
    'SELECT id, created_by FROM projects WHERE id = $1',
    [deterministicId],
  )

  if (byId.rowCount && byId.rows[0].created_by !== demoUserId) {
    throw new Error(`Seed project ID conflict for "${project.name}".`)
  }

  let projectId = byId.rows[0]?.id
  if (!projectId) {
    const sameName = await client.query<{ id: string; created_by: string }>(
      `SELECT id, created_by
       FROM projects
       WHERE team_id = $1 AND LOWER(name) = LOWER($2)`,
      [teamId, project.name],
    )
    if (sameName.rowCount) {
      if (sameName.rows[0].created_by !== demoUserId) {
        throw new Error(
          `A project named "${project.name}" already exists in its team outside the demo account; refusing to modify it.`,
        )
      }
      projectId = sameName.rows[0].id
    }
  }

  if (projectId) {
    await client.query(
      `UPDATE projects
       SET team_id = $1, name = $2, description = $3, status = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [teamId, project.name, project.description, project.status, projectId],
    )
    counts.reused += 1
    return projectId
  }

  await client.query(
    `INSERT INTO projects (id, team_id, name, description, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [deterministicId, teamId, project.name, project.description, project.status, demoUserId],
  )
  counts.created += 1
  return deterministicId
}

export const seedDemoData = async (
  client: PoolClient,
  demoPassword: string,
  nodeEnvironment = env.NODE_ENV,
  databaseName = env.DB_NAME,
): Promise<SeedSummary> => {
  assertSeedEnvironment(nodeEnvironment, databaseName)
  if (!demoPassword || demoPassword.length < 8 || demoPassword.length > 72) {
    throw new Error('Set DEVTRACK_DEMO_PASSWORD to a password between 8 and 72 characters.')
  }

  const summary: SeedSummary = {
    users: emptyCounts(),
    teams: emptyCounts(),
    projects: emptyCounts(),
    tasks: emptyCounts(),
    comments: emptyCounts(),
  }

  const demoPasswordHash = await bcrypt.hash(demoPassword, SALT_ROUNDS)
  const secondaryPasswordHash = await bcrypt.hash(
    randomBytes(32).toString('hex'),
    SALT_ROUNDS,
  )

  await client.query('BEGIN')
  try {
    const userIds = new Map<UserKey, string>()
    for (const user of users) {
      userIds.set(
        user.key,
        await ensureUser(
          client,
          user,
          demoPasswordHash,
          secondaryPasswordHash,
          summary.users,
        ),
      )
    }

    const demoUserId = userIds.get('demo')
    if (!demoUserId) throw new Error('The demo account could not be resolved.')

    const teamIds = new Map<string, string>()
    for (let teamIndex = 0; teamIndex < teams.length; teamIndex += 1) {
      const team = teams[teamIndex]
      const teamId = await ensureTeam(client, team, demoUserId, summary.teams)
      teamIds.set(team.key, teamId)

      for (const member of team.members) {
        const memberId = userIds.get(member.user)
        if (!memberId) throw new Error(`Missing seeded user "${member.user}".`)
        const demoJoinOffset = member.user === 'demo'
          ? -(teamIndex + 1) * 60
          : 0
        await client.query(
          `INSERT INTO team_members (team_id, user_id, role, joined_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP + ($4 * INTERVAL '1 second'))
           ON CONFLICT (team_id, user_id)
           DO UPDATE SET role = EXCLUDED.role, joined_at = EXCLUDED.joined_at`,
          [teamId, memberId, member.role, demoJoinOffset],
        )
      }
    }

    const projectIds = new Map<ProjectKey, string>()
    for (let projectIndex = 0; projectIndex < projects.length; projectIndex += 1) {
      const project = projects[projectIndex]
      const teamId = teamIds.get(project.team)
      if (!teamId) throw new Error(`Missing seeded team "${project.team}".`)
      const projectId = await ensureProject(
        client,
        project,
        teamId,
        demoUserId,
        summary.projects,
      )
      projectIds.set(project.key, projectId)

      for (const member of project.members) {
        const memberId = userIds.get(member.user)
        if (!memberId) throw new Error(`Missing seeded user "${member.user}".`)
        await client.query(
          `INSERT INTO project_members (project_id, user_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (project_id, user_id)
           DO UPDATE SET role = EXCLUDED.role`,
          [projectId, memberId, member.role],
        )
      }

      const taskIds: string[] = []
      for (let taskIndex = 0; taskIndex < project.taskTitles.length; taskIndex += 1) {
        const taskId = deterministicUuid(`task:${project.key}:${taskIndex}`)
        const assignedUserKey = project.members[(taskIndex + 1) % project.members.length].user
        const creatorUserKey = project.members[(taskIndex + 2) % project.members.length].user
        const assignedUserId = userIds.get(assignedUserKey)
        const creatorUserId = userIds.get(creatorUserKey)
        if (!assignedUserId || !creatorUserId) {
          throw new Error(`Missing task user in project "${project.name}".`)
        }

        const existingTask = await client.query<{ project_id: string }>(
          'SELECT project_id FROM tasks WHERE id = $1',
          [taskId],
        )
        if (existingTask.rowCount && existingTask.rows[0].project_id !== projectId) {
          throw new Error(`Seed task ID conflict in project "${project.name}".`)
        }

        const status = taskStatuses[projectIndex][taskIndex]
        const createdAt = dateAtDayOffset(-45 + taskIndex * 2)
        const updatedAt = dateAtDayOffset(-10 + taskIndex)
        await client.query(
          `INSERT INTO tasks (
             id, project_id, title, description, status, priority, position,
             assigned_to, created_by, due_date, created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id)
           DO UPDATE SET
             project_id = EXCLUDED.project_id,
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             priority = EXCLUDED.priority,
             position = EXCLUDED.position,
             assigned_to = EXCLUDED.assigned_to,
             created_by = EXCLUDED.created_by,
             due_date = EXCLUDED.due_date,
             updated_at = EXCLUDED.updated_at`,
          [
            taskId,
            projectId,
            project.taskTitles[taskIndex],
            `Deliver and verify ${project.taskTitles[taskIndex].toLowerCase()} with the project team.`,
            status,
            taskPriorities[taskIndex],
            taskIndex,
            assignedUserId,
            creatorUserId,
            dateAtDayOffset(dueOffsets[taskIndex]),
            createdAt,
            updatedAt,
          ],
        )
        if (existingTask.rowCount) summary.tasks.reused += 1
        else summary.tasks.created += 1
        taskIds.push(taskId)
      }

      for (let commentIndex = 0; commentIndex < taskComments.length; commentIndex += 1) {
        const taskId = taskIds[commentIndex * 3]
        const authorKey = project.members[(commentIndex + 3) % project.members.length].user
        const authorId = userIds.get(authorKey)
        if (!taskId || !authorId) continue
        const commentId = deterministicUuid(`comment:${project.key}:${commentIndex}`)
        const existingComment = await client.query<{ task_id: string }>(
          'SELECT task_id FROM task_comments WHERE id = $1',
          [commentId],
        )
        if (existingComment.rowCount && existingComment.rows[0].task_id !== taskId) {
          throw new Error(`Seed comment ID conflict in project "${project.name}".`)
        }
        await client.query(
          `INSERT INTO task_comments (id, task_id, user_id, content, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $5)
           ON CONFLICT (id)
           DO UPDATE SET
             task_id = EXCLUDED.task_id,
             user_id = EXCLUDED.user_id,
             content = EXCLUDED.content,
             updated_at = EXCLUDED.updated_at`,
          [
            commentId,
            taskId,
            authorId,
            taskComments[commentIndex],
            dateAtDayOffset(-commentIndex - 1),
          ],
        )
        if (existingComment.rowCount) summary.comments.reused += 1
        else summary.comments.created += 1
      }
    }

    await client.query('COMMIT')
    return summary
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

const main = async () => {
  assertSeedEnvironment(env.NODE_ENV, env.DB_NAME)
  const password = process.env.DEVTRACK_DEMO_PASSWORD
  const client = await pool.connect()
  try {
    const summary = await seedDemoData(client, password ?? '')
    console.log(`Demo account is ready: ${DEMO_EMAIL}`)
    for (const [entity, counts] of Object.entries(summary)) {
      console.log(`${entity}: ${counts.created} created, ${counts.reused} reused`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error('Demo seed failed:', error)
    process.exitCode = 1
  })
}
