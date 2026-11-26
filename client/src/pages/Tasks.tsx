import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Eye,
  Flag,
  GripVertical,
  ListTodo,
  LoaderCircle,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import api, { getApiErrorMessage } from '../services/api'
import type {
  ApiResponse,
  CreateTaskPayload,
  ProjectListItem,
  ProjectMember,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskPayload,
} from '../types/api'
import { useTeam } from '../features/teams/hooks/useTeam'

const taskStatuses: { value: TaskStatus; label: string; icon: typeof Circle; color: string }[] = [
  { value: 'backlog', label: 'Backlog', icon: Circle, color: 'text-slate-400' },
  { value: 'in_progress', label: 'In Progress', icon: Clock3, color: 'text-blue-600' },
  { value: 'in_review', label: 'In Review', icon: Eye, color: 'text-amber-600' },
  { value: 'done', label: 'Done', icon: CheckCircle2, color: 'text-lime-700' },
]

const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

const priorityStyles: Record<TaskPriority, string> = {
  urgent: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
}

const inputClass =
  'w-full rounded-xl border border-[#E7E9E3] bg-white px-3 py-2.5 text-sm text-[#26372C] outline-none transition focus:border-[#8DBB69] focus:ring-2 focus:ring-[#8DBB69]/20'

interface TaskDraft {
  title: string
  description: string
  projectId: string
  priority: TaskPriority
  status: TaskStatus
  assigneeId: string
  dueDate: string
}

const emptyDraft: TaskDraft = {
  title: '',
  description: '',
  projectId: '',
  priority: 'medium',
  status: 'backlog',
  assigneeId: '',
  dueDate: '',
}

interface ProjectTasks {
  projects: ProjectListItem[]
  tasks: Task[]
  membersByProject: Record<string, ProjectMember[]>
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const formatDueDate = (date: string | null) => {
  if (!date) return 'No due date'
  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return 'No due date'
  return parsedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

const toIsoDate = (date: string) =>
  date ? new Date(`${date}T00:00:00.000Z`).toISOString() : null

const getTodayDate = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const Tasks = () => {
  const { activeTeamId, loading: teamLoading } = useTeam()
  const [data, setData] = useState<ProjectTasks>({
    projects: [],
    tasks: [],
    membersByProject: {},
  })
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const loadSequence = useRef(0)

  const loadData = useCallback(async () => {
    const sequence = ++loadSequence.current
    if (!activeTeamId) {
      setData({ projects: [], tasks: [], membersByProject: {} })
      setLoading(false)
      setPageError('')
      return
    }

    setLoading(true)
    setPageError('')

    try {
      const projectResponse = await api.get<ApiResponse<ProjectListItem[]>>(
        `/teams/${activeTeamId}/projects`,
      )
      const projects = projectResponse.data.data
      const [taskResponses, memberResponses] = await Promise.all([
        Promise.all(
          projects.map((project) =>
            api.get<ApiResponse<Task[]>>(`/projects/${project.id}/tasks`),
          ),
        ),
        Promise.all(
          projects.map((project) =>
            api.get<ApiResponse<ProjectMember[]>>(`/projects/${project.id}/members`),
          ),
        ),
      ])

      if (sequence !== loadSequence.current) return
      setData({
        projects,
        tasks: taskResponses.flatMap((response) => response.data.data),
        membersByProject: Object.fromEntries(
          projects.map((project, index) => [
            project.id,
            memberResponses[index].data.data,
          ]),
        ),
      })
    } catch (error) {
      if (sequence === loadSequence.current) {
        setPageError(getApiErrorMessage(error, 'Unable to load tasks for this workspace.'))
      }
    } finally {
      if (sequence === loadSequence.current) setLoading(false)
    }
  }, [activeTeamId])

  useEffect(() => {
    if (teamLoading) return
    let cancelled = false
    const initialize = async () => {
      await Promise.resolve()
      if (!cancelled) void loadData()
    }
    void initialize()

    return () => {
      cancelled = true
      loadSequence.current += 1
    }
  }, [loadData, teamLoading])

  const projectById = useMemo(
    () => new Map(data.projects.map((project) => [project.id, project])),
    [data.projects],
  )

  const activeProjects = useMemo(
    () => data.projects.filter((project) => project.status === 'active'),
    [data.projects],
  )

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return data.tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        (task.description ?? '').toLowerCase().includes(query)
      return (
        matchesSearch &&
        (priorityFilter === 'all' || task.priority === priorityFilter) &&
        (assigneeFilter === 'all' || task.assigned_to === assigneeFilter) &&
        (projectFilter === 'all' || task.project_id === projectFilter)
      )
    })
  }, [data.tasks, searchQuery, priorityFilter, assigneeFilter, projectFilter])

  const filtersActive =
    searchQuery.trim() !== '' ||
    priorityFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    projectFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setPriorityFilter('all')
    setAssigneeFilter('all')
    setProjectFilter('all')
  }

  const openCreateModal = () => {
    setMutationError('')
    setEditingTask(null)
    setDraft({ ...emptyDraft, projectId: activeProjects[0]?.id ?? '' })
    setIsModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setMutationError('')
    setEditingTask(task)
    setDraft({
      title: task.title,
      description: task.description ?? '',
      projectId: task.project_id,
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigned_to ?? '',
      dueDate: task.due_date?.slice(0, 10) ?? '',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setIsModalOpen(false)
    setEditingTask(null)
    setMutationError('')
  }

  const handleSaveTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.projectId) return

    setSaving(true)
    setMutationError('')

    try {
      if (editingTask) {
        const payload: UpdateTaskPayload = {
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          priority: draft.priority,
          dueDate: toIsoDate(draft.dueDate),
        }
        const updatedResponse = await api.patch<ApiResponse<Task>>(
          `/tasks/${editingTask.id}`,
          payload,
        )
        let updatedTask = { ...editingTask, ...updatedResponse.data.data }

        if (draft.status !== editingTask.status) {
          const statusResponse = await api.patch<ApiResponse<Task>>(
            `/tasks/${editingTask.id}/status`,
            { status: draft.status },
          )
          updatedTask = { ...updatedTask, ...statusResponse.data.data }
        }

        if (draft.assigneeId !== (editingTask.assigned_to ?? '')) {
          const assignResponse = await api.patch<ApiResponse<Task>>(
            `/tasks/${editingTask.id}/assign`,
            { assignedTo: draft.assigneeId || null },
          )
          updatedTask = { ...updatedTask, ...assignResponse.data.data }
          updatedTask.assignee_name =
            data.membersByProject[editingTask.project_id]?.find(
              (member) => member.id === draft.assigneeId,
            )?.full_name ?? null
        }

        setData((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task,
          ),
        }))
      } else {
        const payload: CreateTaskPayload = {
          title: draft.title.trim(),
          description: draft.description.trim() || undefined,
          priority: draft.priority,
          ...(draft.assigneeId ? { assignedTo: draft.assigneeId } : {}),
          ...(draft.dueDate ? { dueDate: toIsoDate(draft.dueDate) ?? undefined } : {}),
        }
        const response = await api.post<ApiResponse<Task>>(
          `/projects/${draft.projectId}/tasks`,
          payload,
        )
        let createdTask = response.data.data

        if (draft.status !== 'backlog') {
          const statusResponse = await api.patch<ApiResponse<Task>>(
            `/tasks/${createdTask.id}/status`,
            { status: draft.status },
          )
          createdTask = { ...createdTask, ...statusResponse.data.data }
        }

        createdTask.assignee_name =
          data.membersByProject[draft.projectId]?.find(
            (member) => member.id === draft.assigneeId,
          )?.full_name ?? null
        setData((current) => ({
          ...current,
          tasks: [...current.tasks, createdTask],
        }))
      }

      setIsModalOpen(false)
      setEditingTask(null)
    } catch (error) {
      setMutationError(getApiErrorMessage(error, 'Unable to save the task.'))
      void loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return
    setSaving(true)
    setMutationError('')
    try {
      await api.delete(`/tasks/${taskToDelete.id}`)
      setData((current) => ({
        ...current,
        tasks: current.tasks.filter((task) => task.id !== taskToDelete.id),
      }))
      setTaskToDelete(null)
    } catch (error) {
      setMutationError(getApiErrorMessage(error, 'Unable to delete the task.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDragStart = (event: DragEvent<HTMLElement>, taskId: string) => {
    setDraggedTaskId(taskId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', taskId)
  }

  const handleDrop = async (
    event: DragEvent<HTMLDivElement>,
    status: TaskStatus,
  ) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId
    setDraggedTaskId(null)
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task || task.status === status) return

    setMutationError('')
    try {
      const response = await api.patch<ApiResponse<Task>>(
        `/tasks/${task.id}/status`,
        { status },
      )
      setData((current) => ({
        ...current,
        tasks: current.tasks.map((item) =>
          item.id === task.id ? { ...item, ...response.data.data } : item,
        ),
      }))
    } catch (error) {
      setMutationError(getApiErrorMessage(error, 'Unable to update task status.'))
    }
  }

  const availableAssignees = data.membersByProject[draft.projectId] ?? []
  const selectableProjects = data.projects.filter(
    (project) =>
      project.status === 'active' || project.id === editingTask?.project_id,
  )
  const allMembers = Object.values(data.membersByProject).flat()
  const uniqueMembers = Array.from(
    new Map(allMembers.map((member) => [member.id, member])).values(),
  )

  if (teamLoading || loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#7A857D]">
        <LoaderCircle size={18} className="animate-spin" />
        Loading workspace tasks...
      </div>
    )
  }

  if (pageError) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <p role="alert" className="text-sm text-red-700">{pageError}</p>
        <button
          type="button"
          onClick={() => void loadData()}
          className="mt-4 rounded-lg bg-[#14251D] px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#7A857D]">Workspace / Tasks</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#14251D]">Tasks</h1>
          <p className="mt-2 text-sm text-[#7A857D]">
            Manage and track work across your workspace projects.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          disabled={activeProjects.length === 0}
          className="flex items-center gap-2 rounded-xl bg-[#14251D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243C2F] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={17} />
          Add Task
        </button>
      </section>

      {!activeTeamId && (
        <div className="rounded-2xl border border-dashed border-[#D8DED4] bg-white px-6 py-10 text-center">
          <h2 className="font-semibold text-[#26372C]">No workspace selected</h2>
          <p className="mt-2 text-sm text-[#7A857D]">
            Create or select a workspace to see its tasks.
          </p>
        </div>
      )}

      {activeTeamId && activeProjects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#D8DED4] bg-white px-6 py-10 text-center">
          <h2 className="font-semibold text-[#26372C]">No projects yet</h2>
          <p className="mt-2 text-sm text-[#7A857D]">
            Create an active project before adding tasks.
          </p>
        </div>
      )}

      {activeTeamId && (
        <>
          {mutationError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {mutationError}
            </p>
          )}

          <section className="space-y-3 rounded-2xl border border-[#E8EBE3] bg-white p-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={17} className="text-[#526B59]" />
              <h2 className="text-sm font-semibold text-[#26372C]">Search and filters</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="relative min-w-0">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A978C]" />
                <input
                  type="search"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className={`${inputClass} pl-10`}
                  aria-label="Search tasks"
                />
              </div>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={inputClass} aria-label="Filter by priority">
                <option value="all">All priorities</option>
                {priorities.map((priority) => <option key={priority} value={priority}>{priority[0].toUpperCase() + priority.slice(1)}</option>)}
              </select>
              <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className={inputClass} aria-label="Filter by assignee">
                <option value="all">All assignees</option>
                <option value="">Unassigned</option>
                {uniqueMembers.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}
              </select>
              <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className={inputClass} aria-label="Filter by project">
                <option value="all">All projects</option>
                {data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#89938B]">Showing {filteredTasks.length} of {data.tasks.length} tasks</p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="text-sm font-semibold text-[#31543C] hover:text-[#14251D]">
                  Clear filters
                </button>
              )}
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 rounded-lg bg-[#EAF1E8] px-3 py-2 text-sm font-semibold text-[#31543C]">
              <ListTodo size={16} />
              Workspace board
            </span>
            <span className="text-sm text-[#7A857D]">{filteredTasks.length} visible tasks</span>
          </section>

          <section className="w-full min-w-0 overflow-x-auto pb-4">
            <div className="grid min-w-max grid-cols-4 gap-4">
              {taskStatuses.map((status) => {
                const StatusIcon = status.icon
                const columnTasks = filteredTasks.filter((task) => task.status === status.value)
                return (
                  <div
                    key={status.value}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => void handleDrop(event, status.value)}
                    className={`w-72 rounded-2xl p-3 transition-colors ${draggedTaskId ? 'bg-[#E8EDE3]' : 'bg-[#F0F2EC]'}`}
                  >
                    <div className="mb-4 flex items-center gap-2 px-1 py-1">
                      <StatusIcon size={17} className={status.color} />
                      <h2 className="text-sm font-bold text-[#26372C]">{status.label}</h2>
                      <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-[#7A857D]">{columnTasks.length}</span>
                    </div>
                    <div className="space-y-3">
                      {columnTasks.map((task) => {
                        const project = projectById.get(task.project_id)
                        const isOverdue = task.due_date !== null &&
                          task.due_date.slice(0, 10) < getTodayDate() &&
                          task.status !== 'done'
                        return (
                          <article
                            key={task.id}
                            draggable
                            onDragStart={(event) => handleDragStart(event, task.id)}
                            onDragEnd={() => setDraggedTaskId(null)}
                            onClick={() => openEditModal(task)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openEditModal(task)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Edit task ${task.title}`}
                            className={`cursor-grab rounded-xl border border-[#E7E9E3] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8DBB69] active:cursor-grabbing ${draggedTaskId === task.id ? 'opacity-40' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-medium text-[#8A958C]">{project?.name ?? 'Project'}</span>
                              <GripVertical size={16} className="shrink-0 text-[#C0C8BE]" />
                            </div>
                            <h3 className="mt-3 text-sm font-semibold leading-5 text-[#26372C]">{task.title}</h3>
                            {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#7A857D]">{task.description}</p>}
                            <div className="mt-4 flex items-center justify-between gap-2">
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${priorityStyles[task.priority]}`}>
                                <Flag size={12} />
                                {task.priority[0].toUpperCase() + task.priority.slice(1)}
                              </span>
                              <span title={task.assignee_name ?? 'Unassigned'} className="flex size-7 items-center justify-center rounded-full bg-[#E5EDE1] text-xs font-bold text-[#31543C]">
                                {getInitials(task.assignee_name)}
                              </span>
                            </div>
                            <div className={`mt-4 flex items-center gap-1.5 border-t border-[#EEF0EB] pt-3 text-xs ${isOverdue ? 'font-semibold text-red-600' : 'text-[#89938B]'}`}>
                              <CalendarDays size={13} />
                              {formatDueDate(task.due_date)}
                              {isOverdue && <span className="ml-auto">Overdue</span>}
                            </div>
                          </article>
                        )
                      })}
                      {columnTasks.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#D8DED4] px-3 py-8 text-center">
                          <p className="text-xs text-[#89938B]">{filtersActive ? 'No matching tasks' : 'No tasks in this column'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {filteredTasks.length === 0 && data.tasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#D8DED4] bg-white px-6 py-10 text-center">
              <h2 className="font-semibold text-[#26372C]">No tasks yet</h2>
              <p className="mt-2 text-sm text-[#7A857D]">Add a task to start tracking work.</p>
            </div>
          )}
          {filteredTasks.length === 0 && data.tasks.length > 0 && (
            <div className="rounded-2xl border border-dashed border-[#D8DED4] bg-white px-6 py-10 text-center">
              <Search size={25} className="mx-auto text-[#89938B]" />
              <h2 className="mt-3 font-semibold text-[#26372C]">No tasks found</h2>
              <p className="mt-1 text-sm text-[#89938B]">Try changing your search or filters.</p>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal()
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="task-modal-title" className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 id="task-modal-title" className="text-xl font-bold text-[#14251D]">{editingTask ? 'Edit task' : 'Create a task'}</h2>
                <p className="mt-1 text-sm text-[#7A857D]">Task changes are saved to this workspace.</p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-[#7A857D] hover:bg-[#F0F2EC]">
                <X size={19} />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label htmlFor="task-title" className="mb-2 block text-sm font-semibold text-[#26372C]">Task title</label>
                <input id="task-title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Enter task title" required maxLength={200} autoFocus className={inputClass} />
              </div>
              <div>
                <label htmlFor="task-description" className="mb-2 block text-sm font-semibold text-[#26372C]">Description</label>
                <textarea id="task-description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Describe what needs to be done..." rows={3} maxLength={5000} className={inputClass} />
              </div>
              <div>
                <label htmlFor="task-project" className="mb-2 block text-sm font-semibold text-[#26372C]">Project</label>
                <select id="task-project" value={draft.projectId} disabled={Boolean(editingTask)} onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value, assigneeId: '' }))} required className={inputClass}>
                  {selectableProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="task-assignee" className="mb-2 block text-sm font-semibold text-[#26372C]">Assignee</label>
                  <select id="task-assignee" value={draft.assigneeId} onChange={(event) => setDraft((current) => ({ ...current, assigneeId: event.target.value }))} className={inputClass}>
                    <option value="">Unassigned</option>
                    {availableAssignees.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="task-status" className="mb-2 block text-sm font-semibold text-[#26372C]">Status</label>
                  <select id="task-status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as TaskStatus }))} className={inputClass}>
                    {taskStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="task-priority" className="mb-2 block text-sm font-semibold text-[#26372C]">Priority</label>
                  <select id="task-priority" value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as TaskPriority }))} className={inputClass}>
                    {priorities.map((priority) => <option key={priority} value={priority}>{priority[0].toUpperCase() + priority.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="task-due-date" className="mb-2 block text-sm font-semibold text-[#26372C]">Due date</label>
                  <input id="task-due-date" type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} className={inputClass} />
                </div>
              </div>
              {mutationError && <p role="alert" className="text-sm text-red-700">{mutationError}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0EB] pt-5">
                {editingTask ? (
                  <button type="button" onClick={() => { setIsModalOpen(false); setTaskToDelete(editingTask) }} disabled={saving} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                    <Trash2 size={16} /> Delete task
                  </button>
                ) : <span />}
                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-[#E7E9E3] px-4 py-2.5 text-sm font-semibold text-[#526B59] hover:bg-[#F5F7F2]">Cancel</button>
                  <button type="submit" disabled={saving || !draft.title.trim() || !draft.projectId} className="flex items-center gap-2 rounded-xl bg-[#14251D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#243C2F] disabled:cursor-not-allowed disabled:opacity-50">
                    {saving && <LoaderCircle size={16} className="animate-spin" />}
                    {saving ? 'Saving...' : editingTask ? 'Save changes' : 'Create task'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-task-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-task-title" className="text-lg font-bold text-[#14251D]">Delete task?</h2>
            <p className="mt-2 text-sm text-[#7A857D]">“{taskToDelete.title}” will be permanently deleted.</p>
            {mutationError && <p role="alert" className="mt-3 text-sm text-red-700">{mutationError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setTaskToDelete(null); setMutationError('') }} disabled={saving} className="rounded-xl border border-[#E7E9E3] px-4 py-2.5 text-sm font-semibold text-[#526B59]">Cancel</button>
              <button type="button" onClick={() => void handleDeleteTask()} disabled={saving} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                Delete task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
