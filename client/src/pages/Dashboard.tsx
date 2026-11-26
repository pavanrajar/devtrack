import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  LoaderCircle,
  MessageSquareText,
  UserRoundCheck,
} from 'lucide-react'
import api, { getApiErrorMessage } from '../services/api'
import type { ApiResponse, DashboardData } from '../types/api'
import { useTeam } from '../features/teams/hooks/useTeam'

const priorityColors: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-sky-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
}

const Dashboard = () => {
  const { activeTeam, activeTeamId, loading: teamLoading } = useTeam()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!activeTeamId) {
      setData(null)
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await api.get<ApiResponse<DashboardData>>(
        `/teams/${activeTeamId}/dashboard`,
      )
      setData(response.data.data)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load workspace overview.'))
    } finally {
      setLoading(false)
    }
  }, [activeTeamId])

  useEffect(() => {
    if (teamLoading) return
    const initialize = async () => {
      await Promise.resolve()
      void loadDashboard()
    }
    void initialize()
  }, [loadDashboard, teamLoading])

  if (teamLoading || loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#7A857D]">
        <LoaderCircle size={18} className="animate-spin" />
        Loading workspace overview...
      </div>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button type="button" onClick={() => void loadDashboard()} className="mt-4 rounded-lg bg-[#14251D] px-4 py-2 text-sm font-semibold text-white">Retry</button>
      </section>
    )
  }

  if (!activeTeamId || !data) {
    return (
      <section className="rounded-2xl border border-dashed border-[#D8DED4] bg-white px-6 py-12 text-center">
        <FolderKanban size={28} className="mx-auto text-[#526B59]" />
        <h1 className="mt-4 text-xl font-bold text-[#14251D]">Welcome to DevTrack</h1>
        <p className="mt-2 text-sm text-[#7A857D]">Create or select a workspace to see projects and task progress.</p>
      </section>
    )
  }

  const { summary } = data
  const taskStatusLabels: Record<string, string> = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  }
  const taskPriorityLabels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-[#14251D] p-8 text-white">
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">Workspace overview</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {activeTeam?.name ? `Welcome to ${activeTeam.name}` : 'Your workspace, at a glance'}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
            Review live project progress, current workloads, and recent team comments.
          </p>
          <Link to="/projects" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-semibold text-[#14251D] transition hover:bg-lime-200">
            <FolderKanban size={17} /> View projects
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border border-lime-300/20" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-52 w-52 rounded-full border border-lime-300/20" />
        <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-lime-300/10 blur-3xl" />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <MetricCard label="Total projects" value={summary.totalProjects} icon={<FolderKanban size={18} className="text-[#66836E]" />} />
        <MetricCard label="Active projects" value={summary.activeProjects} icon={<FolderKanban size={18} className="text-[#66836E]" />} />
        <MetricCard label="Archived projects" value={summary.completedProjects} icon={<CheckCircle2 size={18} className="text-lime-600" />} />
        <MetricCard label="Total tasks" value={summary.totalTasks} icon={<ListTodo size={18} className="text-[#66836E]" />} />
        <MetricCard label="Completed tasks" value={summary.completedTasks} icon={<CheckCircle2 size={18} className="text-lime-600" />} />
        <MetricCard label="Pending tasks" value={summary.pendingTasks} icon={<ListTodo size={18} className="text-amber-600" />} />
        <MetricCard label="In progress" value={summary.inProgressTasks} icon={<Clock3 size={18} className="text-sky-600" />} />
        <MetricCard label="Overdue" value={summary.overdueTasks} icon={<AlertCircle size={18} className="text-red-600" />} />
        <MetricCard label="Assigned to me" value={summary.assignedToMe} icon={<UserRoundCheck size={18} className="text-[#66836E]" />} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#14251D]">Projects</h2>
              <p className="mt-1 text-sm text-slate-500">Progress is calculated from persisted task statuses.</p>
            </div>
            <Link to="/projects" className="flex items-center gap-1 text-sm font-semibold text-[#52745C] hover:text-[#14251D]">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          {data.projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D8DED4] bg-white px-5 py-8 text-center">
              <p className="text-sm text-slate-500">There are no projects in this workspace yet.</p>
              <Link to="/projects" className="mt-3 inline-flex text-sm font-semibold text-[#31543C]">Create a project</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.projects.slice(0, 5).map((project) => (
                <article key={project.id} className="rounded-xl border border-[#E7E9E3] bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1E8] text-[#31543C]"><FolderKanban size={19} /></div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-[#14251D]">{project.name}</h3>
                        <p className="mt-1 truncate text-xs text-slate-400">{project.description || 'No description'}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[#52745C]">{project.progress}%</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>{project.completedTasks} of {project.totalTasks} tasks complete</span>
                    <span className="capitalize">{project.status}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF0EA]">
                    <div className="h-full rounded-full bg-[#8DBB69]" style={{ width: `${project.progress}%` }} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-[#E7E9E3] bg-white p-5">
            <div>
              <h2 className="text-lg font-bold text-[#14251D]">Tasks by status</h2>
              <p className="mt-1 text-xs text-slate-400">Current workspace totals</p>
            </div>
            <div className="mt-5 space-y-4">
              {data.tasksByStatus.map(({ status, count }) => {
                const percent = summary.totalTasks === 0 ? 0 : Math.round((count / summary.totalTasks) * 100)
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-[#526B59]">{taskStatusLabels[status] ?? status}</span>
                      <span className="font-semibold text-[#14251D]">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF0EA]">
                      <div className="h-full rounded-full bg-[#8DBB69]" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-[#E7E9E3] bg-white p-5">
            <h2 className="text-lg font-bold text-[#14251D]">Tasks by priority</h2>
            <p className="mt-1 text-xs text-slate-400">Open and completed work</p>
            <div className="mt-5 space-y-4">
              {data.tasksByPriority.map(({ priority, count }) => {
                const percent = summary.totalTasks === 0 ? 0 : Math.round((count / summary.totalTasks) * 100)
                return (
                  <div key={priority}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="flex items-center gap-2 text-[#526B59]">
                        <span className={`size-2 rounded-full ${priorityColors[priority] ?? 'bg-slate-400'}`} />
                        {taskPriorityLabels[priority] ?? priority}
                      </span>
                      <span className="font-semibold text-[#14251D]">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF0EA]">
                      <div className={`h-full rounded-full ${priorityColors[priority] ?? 'bg-slate-400'}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <Link to="/tasks" className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#E7E9E3] py-2.5 text-sm font-semibold text-[#31543C] hover:bg-[#F5F8F2]">
              Open task board <ArrowRight size={15} />
            </Link>
          </section>

          <section className="rounded-xl border border-[#E7E9E3] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#14251D]">Recent activity</h2>
                <p className="mt-1 text-xs text-slate-400">Latest project comments</p>
              </div>
              <MessageSquareText size={18} className="text-slate-400" />
            </div>
            {data.recentActivity.length === 0 ? (
              <p className="mt-5 text-sm text-slate-500">No comments have been added to accessible project tasks yet.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {data.recentActivity.map((activity) => (
                  <li key={activity.id} className="border-l-2 border-[#DCE8D6] pl-3">
                    <p className="text-sm font-medium leading-5 text-[#14251D]">{activity.author_name} commented on {activity.task_title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{activity.content}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{activity.project_name} · {new Date(activity.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: number
  icon: ReactNode
}

const MetricCard = ({ label, value, icon }: MetricCardProps) => (
  <div className="rounded-xl border border-[#E7E9E3] bg-white p-5">
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-500">{label}</p>
      {icon}
    </div>
    <h2 className="mt-3 text-3xl font-bold text-[#14251D]">{value}</h2>
  </div>
)

export default Dashboard
