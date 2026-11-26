import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Archive,
  CalendarDays,
  FolderKanban,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import api, { getApiErrorMessage } from '../services/api'
import type { ApiResponse, ProjectListItem, ProjectMember, Task } from '../types/api'
import { useTeam } from '../features/teams/hooks/useTeam'

interface ProjectData {
  project: ProjectListItem
  totalTasks: number
  completedTasks: number
}

interface ProjectDraft {
  name: string
  description: string
}

const emptyDraft: ProjectDraft = { name: '', description: '' }

const inputClass =
  'w-full rounded-xl border border-[#E7E9E3] bg-white px-3 py-2.5 text-sm text-[#26372C] outline-none transition focus:border-[#8DBB69] focus:ring-2 focus:ring-[#8DBB69]/20'

const Projects = () => {
  const { activeTeamId, loading: teamLoading } = useTeam()
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null)
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [memberProject, setMemberProject] = useState<ProjectListItem | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [memberEmail, setMemberEmail] = useState('')
  const [membersLoading, setMembersLoading] = useState(false)

  const loadProjects = useCallback(async () => {
    if (!activeTeamId) {
      setProjects([])
      setLoading(false)
      setPageError('')
      return
    }

    setLoading(true)
    setPageError('')
    try {
      const response = await api.get<ApiResponse<ProjectListItem[]>>(
        `/teams/${activeTeamId}/projects`,
      )
      const projectList = response.data.data
      const taskResponses = await Promise.all(
        projectList.map((project) =>
          api.get<ApiResponse<Task[]>>(`/projects/${project.id}/tasks`),
        ),
      )
      setProjects(
        projectList.map((project, index) => {
          const tasks = taskResponses[index].data.data
          return {
            project,
            totalTasks: tasks.length,
            completedTasks: tasks.filter((task) => task.status === 'done').length,
          }
        }),
      )
    } catch (error) {
      setPageError(getApiErrorMessage(error, 'Unable to load projects.'))
    } finally {
      setLoading(false)
    }
  }, [activeTeamId])

  useEffect(() => {
    if (teamLoading) return
    const initialize = async () => {
      await Promise.resolve()
      void loadProjects()
    }
    void initialize()
  }, [loadProjects, teamLoading])

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    return projects.filter(({ project }) =>
      `${project.name} ${project.description ?? ''}`.toLowerCase().includes(query),
    )
  }, [projects, search])

  const activeCount = projects.filter(({ project }) => project.status === 'active').length
  const archivedCount = projects.length - activeCount

  const openCreateModal = () => {
    setEditingProject(null)
    setDraft(emptyDraft)
    setActionError('')
    setIsProjectModalOpen(true)
  }

  const openEditModal = (project: ProjectListItem) => {
    setEditingProject(project)
    setDraft({ name: project.name, description: project.description ?? '' })
    setActionError('')
    setIsProjectModalOpen(true)
  }

  const closeProjectModal = () => {
    if (saving) return
    setIsProjectModalOpen(false)
    setEditingProject(null)
    setActionError('')
  }

  const handleSaveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim()) return
    setSaving(true)
    setActionError('')
    try {
      if (editingProject) {
        await api.patch(`/projects/${editingProject.id}`, {
          name: draft.name.trim(),
          description: draft.description.trim(),
        })
      } else {
        if (!activeTeamId) return
        await api.post(`/teams/${activeTeamId}/projects`, {
          name: draft.name.trim(),
          description: draft.description.trim() || undefined,
        })
      }
      setIsProjectModalOpen(false)
      setEditingProject(null)
      await loadProjects()
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Unable to save the project.'))
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveProject = async (project: ProjectListItem) => {
    if (!window.confirm(`Archive “${project.name}”? Existing project data will be preserved.`)) return
    setActionError('')
    try {
      await api.patch(`/projects/${project.id}/archive`)
      await loadProjects()
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Unable to archive the project.'))
    }
  }

  const openMembers = async (project: ProjectListItem) => {
    setMemberProject(project)
    setMembers([])
    setMemberEmail('')
    setActionError('')
    setMembersLoading(true)
    try {
      const response = await api.get<ApiResponse<ProjectMember[]>>(
        `/projects/${project.id}/members`,
      )
      setMembers(response.data.data)
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Unable to load project members.'))
    } finally {
      setMembersLoading(false)
    }
  }

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!memberProject || !memberEmail.trim()) return
    setSaving(true)
    setActionError('')
    try {
      await api.post(`/projects/${memberProject.id}/members`, {
        email: memberEmail.trim(),
      })
      const response = await api.get<ApiResponse<ProjectMember[]>>(
        `/projects/${memberProject.id}/members`,
      )
      setMembers(response.data.data)
      setMemberEmail('')
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Unable to add this project member.'))
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!memberProject) return
    if (!window.confirm(`Remove ${member.full_name} from ${memberProject.name}?`)) return

    setSaving(true)
    setActionError('')
    try {
      await api.delete(`/projects/${memberProject.id}/members/${member.id}`)
      setMembers((current) => current.filter((item) => item.id !== member.id))
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Unable to remove this project member.'))
    } finally {
      setSaving(false)
    }
  }

  if (teamLoading || loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#7A857D]">
        <LoaderCircle size={18} className="animate-spin" />
        Loading projects...
      </div>
    )
  }

  if (pageError) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <p role="alert" className="text-sm text-red-700">{pageError}</p>
        <button type="button" onClick={() => void loadProjects()} className="mt-4 rounded-lg bg-[#14251D] px-4 py-2 text-sm font-semibold text-white">
          Retry
        </button>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#7A857D]">Workspace / Projects</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#14251D]">Projects</h1>
          <p className="mt-2 text-sm text-[#7A857D]">Organize work and keep each project moving forward.</p>
        </div>
        <button type="button" onClick={openCreateModal} disabled={!activeTeamId} className="flex items-center gap-2 rounded-xl bg-[#14251D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#243C2F] disabled:opacity-50">
          <Plus size={17} /> New Project
        </button>
      </section>

      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {!activeTeamId ? (
        <div className="rounded-2xl border border-dashed border-[#D8DED4] bg-white px-6 py-10 text-center">
          <h2 className="font-semibold text-[#26372C]">No workspace selected</h2>
          <p className="mt-2 text-sm text-[#7A857D]">Create or select a workspace to manage projects.</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E7E9E3] bg-white p-5">
              <p className="text-sm text-[#7A857D]">Total projects</p>
              <p className="mt-3 text-3xl font-bold text-[#14251D]">{projects.length}</p>
            </div>
            <div className="rounded-2xl border border-[#E7E9E3] bg-white p-5">
              <p className="text-sm text-[#7A857D]">Active</p>
              <p className="mt-3 text-3xl font-bold text-[#14251D]">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-[#E7E9E3] bg-white p-5">
              <p className="text-sm text-[#7A857D]">Archived</p>
              <p className="mt-3 text-3xl font-bold text-[#14251D]">{archivedCount}</p>
            </div>
          </section>

          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#14251D]">Your projects</h2>
                <p className="mt-1 text-sm text-[#7A857D]">Progress is calculated from persisted task data.</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A978C]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search projects" placeholder="Search projects..." className={`${inputClass} pl-10`} />
              </div>
            </div>

            {visibleProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8DED4] bg-white px-6 py-10 text-center">
                <FolderKanban size={25} className="mx-auto text-[#89938B]" />
                <h3 className="mt-3 font-semibold text-[#26372C]">{projects.length ? 'No matching projects' : 'No projects yet'}</h3>
                <p className="mt-1 text-sm text-[#7A857D]">{projects.length ? 'Try another search.' : 'Create a project to start organizing work.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {visibleProjects.map(({ project, totalTasks, completedTasks }) => {
                  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
                  return (
                    <article key={project.id} className="rounded-2xl border border-[#E7E9E3] bg-white p-6 transition hover:border-[#C8D5C7] hover:shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center rounded-xl bg-[#EAF1E8] text-[#31543C]"><FolderKanban size={21} /></div>
                          <div>
                            <h3 className="font-bold text-[#14251D]">{project.name}</h3>
                            <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${project.status === 'active' ? 'bg-[#EEF4E9] text-[#526B59]' : 'bg-slate-100 text-slate-600'}`}>
                              {project.status === 'active' ? 'Active' : 'Archived'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-5 min-h-10 text-sm leading-6 text-[#7A857D]">{project.description || 'No project description.'}</p>
                      <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-[#526B59]">{completedTasks} of {totalTasks} tasks completed</span>
                          <span className="font-bold text-[#14251D]">{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#EDF0E9]" role="progressbar" aria-label={`${project.name} progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                          <div className="h-full rounded-full bg-[#8DBB69]" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#EEF0EB] pt-5">
                        <button type="button" onClick={() => void openMembers(project)} className="inline-flex items-center gap-2 rounded-lg border border-[#E7E9E3] px-3 py-2 text-sm font-semibold text-[#31543C] hover:bg-[#F5F8F2]">
                          <Users size={15} /> Members
                        </button>
                        {project.status === 'active' && (
                          <>
                            <button type="button" onClick={() => openEditModal(project)} className="rounded-lg border border-[#E7E9E3] px-3 py-2 text-sm font-semibold text-[#31543C] hover:bg-[#F5F8F2]">Edit</button>
                            <button type="button" onClick={() => void handleArchiveProject(project)} className="inline-flex items-center gap-2 rounded-lg border border-[#E7E9E3] px-3 py-2 text-sm font-semibold text-[#7A857D] hover:bg-[#F5F8F2]">
                              <Archive size={15} /> Archive
                            </button>
                          </>
                        )}
                        <span className="ml-auto flex items-center gap-1 self-center text-xs text-[#89938B]">
                          <CalendarDays size={13} /> Updated {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}

      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeProjectModal()
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="project-modal-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 id="project-modal-title" className="text-xl font-bold text-[#14251D]">{editingProject ? 'Edit project' : 'Create a project'}</h2>
                <p className="mt-1 text-sm text-[#7A857D]">Keep your project details up to date.</p>
              </div>
              <button type="button" onClick={closeProjectModal} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-[#7A857D] hover:bg-[#F0F2EC]"><X size={19} /></button>
            </div>
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label htmlFor="project-name" className="mb-2 block text-sm font-semibold text-[#26372C]">Project name</label>
                <input id="project-name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} minLength={3} maxLength={100} required autoFocus className={inputClass} />
              </div>
              <div>
                <label htmlFor="project-description" className="mb-2 block text-sm font-semibold text-[#26372C]">Description</label>
                <textarea id="project-description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={3} maxLength={500} className={inputClass} />
              </div>
              {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
              <div className="flex justify-end gap-3 border-t border-[#EEF0EB] pt-5">
                <button type="button" onClick={closeProjectModal} disabled={saving} className="rounded-xl border border-[#E7E9E3] px-4 py-2.5 text-sm font-semibold text-[#526B59]">Cancel</button>
                <button type="submit" disabled={saving || draft.name.trim().length < 3} className="flex items-center gap-2 rounded-xl bg-[#14251D] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? 'Saving...' : editingProject ? 'Save changes' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {memberProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMemberProject(null)
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="members-title" className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 id="members-title" className="text-xl font-bold text-[#14251D]">Project members</h2>
                <p className="mt-1 text-sm text-[#7A857D]">{memberProject.name}</p>
              </div>
              <button type="button" onClick={() => setMemberProject(null)} aria-label="Close members" className="rounded-lg p-2 text-[#7A857D] hover:bg-[#F0F2EC]"><X size={19} /></button>
            </div>
            {actionError && <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>}
            {membersLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-[#7A857D]"><LoaderCircle size={17} className="animate-spin" /> Loading members...</div>
            ) : (
              <ul className="max-h-60 space-y-2 overflow-y-auto">
                {members.map((member) => (
                  <li key={member.id} className="flex items-center justify-between rounded-xl bg-[#F6F8F3] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#26372C]">{member.full_name}</p>
                      <p className="truncate text-xs text-[#7A857D]">{member.email}</p>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      <span className="text-xs capitalize text-[#526B59]">{member.role}</span>
                      {memberProject.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => void handleRemoveMember(member)}
                          disabled={saving}
                          aria-label={`Remove ${member.full_name}`}
                          title="Remove member"
                          className="rounded-lg p-2 text-[#89938B] hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {members.length === 0 && <li className="py-4 text-center text-sm text-[#7A857D]">No members found.</li>}
              </ul>
            )}
            {memberProject.status === 'active' && (
              <form onSubmit={handleAddMember} className="mt-5 flex flex-col gap-2 border-t border-[#EEF0EB] pt-5 sm:flex-row">
                <input type="email" required value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="teammate@example.com" aria-label="Member email" className={inputClass} />
                <button type="submit" disabled={saving || membersLoading} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14251D] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {saving && <LoaderCircle size={16} className="animate-spin" />} Add member
                </button>
              </form>
            )}
            <p className="mt-3 text-xs text-[#89938B]">Members must already belong to this workspace.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Projects
