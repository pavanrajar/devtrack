
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface ApiErrorResponse {
  success?: boolean
  message?: string
  errors?: Array<{
    field?: string
    message: string
  }>
}

export interface User {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export interface AuthResult {
  user: User
}

export interface Team {
  id: string
  name: string
  description: string | null
  created_at: string
  role: 'owner' | 'admin' | 'member'
  joined_at?: string
}

export type TeamRole = Team['role']

export interface TeamMember {
  id: string
  full_name: string
  email: string
  role: TeamRole
  joined_at: string
}

export interface ProjectListItem {
  id: string
  team_id: string
  name: string
  description: string | null
  status: string
  created_by: string
  created_at: string
  updated_at: string
  project_role: 'manager' | 'member' | null
}

export interface Project {
  id: string
  teamId: string
  name: string
  description: string | null
  status: string
  createdBy: string
  createdAt: string
  updatedAt: string
  projectRole: 'manager' | 'member' | null
}

export interface ProjectMember {
  id: string
  full_name: string
  email: string
  role: 'manager' | 'member'
  joined_at: string
}

export type TaskStatus =
  | 'backlog'
  | 'in_progress'
  | 'in_review'
  | 'done'

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  created_by: string
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
  assignee_name?: string | null
  creator_name?: string | null
}

export interface DashboardSummary {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  inProgressTasks: number
  overdueTasks: number
  assignedToMe: number
}

export interface DashboardProject {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  updatedAt: string
  totalTasks: number
  completedTasks: number
  progress: number
}

export interface DashboardActivity {
  id: string
  task_id: string
  task_title: string
  project_id: string
  project_name: string
  user_id: string
  author_name: string
  content: string
  created_at: string
}

export interface DashboardData {
  summary: DashboardSummary
  projects: DashboardProject[]
  tasksByStatus: Array<{ status: TaskStatus; count: number }>
  tasksByPriority: Array<{ priority: TaskPriority; count: number }>
  recentActivity: DashboardActivity[]
}

export interface CreateTaskPayload {
  title: string
  description?: string
  priority?: TaskPriority
  assignedTo?: string
  dueDate?: string
}

export interface UpdateTaskPayload {
  title?: string
  description?: string | null
  priority?: TaskPriority
  dueDate?: string | null
}
