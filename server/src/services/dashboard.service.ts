import { pool } from '../config/database'

const accessibleProjectsCte = `
  accessible_projects AS (
    SELECT p.id, p.team_id, p.name, p.description, p.status, p.updated_at
    FROM projects p
    INNER JOIN team_members tm
      ON tm.team_id = p.team_id AND tm.user_id = $2
    LEFT JOIN project_members pm
      ON pm.project_id = p.id AND pm.user_id = $2
    WHERE p.team_id = $1
      AND (tm.role IN ('owner', 'admin') OR pm.user_id IS NOT NULL)
  )
`

const asNumber = (value: string | number | null | undefined) =>
  Number(value ?? 0)

export const getTeamDashboard = async (teamId: string, userId: string) => {
  const [summaryResult, projectResult, statusResult, priorityResult, activityResult] =
    await Promise.all([
      pool.query(
        `WITH ${accessibleProjectsCte}
         SELECT
           COUNT(DISTINCT p.id) AS total_projects,
           COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') AS active_projects,
           COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'archived') AS completed_projects,
           COUNT(t.id) AS total_tasks,
           COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
           COUNT(t.id) FILTER (WHERE t.status IN ('backlog', 'in_review')) AS pending_tasks,
           COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress_tasks,
           COUNT(t.id) FILTER (
             WHERE t.status <> 'done'
               AND t.due_date < CURRENT_DATE
           ) AS overdue_tasks,
           COUNT(t.id) FILTER (WHERE t.assigned_to = $2) AS assigned_to_me
         FROM accessible_projects p
         LEFT JOIN tasks t ON t.project_id = p.id`,
        [teamId, userId],
      ),
      pool.query(
        `WITH ${accessibleProjectsCte}
         SELECT
           p.id,
           p.name,
           p.description,
           p.status,
           p.updated_at,
           COUNT(t.id) AS total_tasks,
           COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed_tasks
         FROM accessible_projects p
         LEFT JOIN tasks t ON t.project_id = p.id
         GROUP BY p.id, p.name, p.description, p.status, p.updated_at
         ORDER BY p.updated_at DESC, p.name ASC`,
        [teamId, userId],
      ),
      pool.query(
        `WITH ${accessibleProjectsCte}
         SELECT t.status, COUNT(*) AS count
         FROM accessible_projects p
         INNER JOIN tasks t ON t.project_id = p.id
         GROUP BY t.status`,
        [teamId, userId],
      ),
      pool.query(
        `WITH ${accessibleProjectsCte}
         SELECT t.priority, COUNT(*) AS count
         FROM accessible_projects p
         INNER JOIN tasks t ON t.project_id = p.id
         GROUP BY t.priority`,
        [teamId, userId],
      ),
      pool.query(
        `WITH ${accessibleProjectsCte}
         SELECT
           c.id,
           c.task_id,
           t.title AS task_title,
           p.id AS project_id,
           p.name AS project_name,
           c.user_id,
           u.full_name AS author_name,
           c.content,
           c.created_at
         FROM accessible_projects p
         INNER JOIN tasks t ON t.project_id = p.id
         INNER JOIN task_comments c ON c.task_id = t.id
         INNER JOIN users u ON u.id = c.user_id
         ORDER BY c.created_at DESC
         LIMIT 10`,
        [teamId, userId],
      ),
    ])

  const summary = summaryResult.rows[0]
  const statusCounts = new Map(
    statusResult.rows.map((row) => [row.status as string, asNumber(row.count)]),
  )
  const priorityCounts = new Map(
    priorityResult.rows.map((row) => [row.priority as string, asNumber(row.count)]),
  )

  return {
    summary: {
      totalProjects: asNumber(summary.total_projects),
      activeProjects: asNumber(summary.active_projects),
      completedProjects: asNumber(summary.completed_projects),
      totalTasks: asNumber(summary.total_tasks),
      completedTasks: asNumber(summary.completed_tasks),
      pendingTasks: asNumber(summary.pending_tasks),
      inProgressTasks: asNumber(summary.in_progress_tasks),
      overdueTasks: asNumber(summary.overdue_tasks),
      assignedToMe: asNumber(summary.assigned_to_me),
    },
    projects: projectResult.rows.map((project) => {
      const totalTasks = asNumber(project.total_tasks)
      const completedTasks = asNumber(project.completed_tasks)
      return {
        id: project.id as string,
        name: project.name as string,
        description: project.description as string | null,
        status: project.status as 'active' | 'archived',
        updatedAt: project.updated_at,
        totalTasks,
        completedTasks,
        progress: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
      }
    }),
    tasksByStatus: ['backlog', 'in_progress', 'in_review', 'done'].map((status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    })),
    tasksByPriority: ['low', 'medium', 'high', 'urgent'].map((priority) => ({
      priority,
      count: priorityCounts.get(priority) ?? 0,
    })),
    recentActivity: activityResult.rows,
  }
}
