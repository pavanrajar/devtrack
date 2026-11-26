
import { useState, type FormEvent } from 'react'
import {
  Layers3,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ChevronDown,
  Check,
  Plus,
  X,
  LogOut,
  LoaderCircle,
  Users,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useTeam } from '../features/teams/hooks/useTeam'
import { getApiErrorMessage } from '../services/api'
import type { Team } from '../types/api';

const Sidebar = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const {
    teams,
    activeTeam,
    activeTeamId,
    loading,
    error,
    createTeam,
    selectTeam,
  } = useTeam()

  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
      isActive
        ? 'bg-lime-300 font-semibold text-slate-950'
        : 'text-slate-400 hover:bg-white/10 hover:text-white'
    }`

  const initials = user?.fullName
    ? user.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'U'

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    if (teamName.trim().length < 2) {
      setFormError('Workspace name must contain at least 2 characters.')
      return
    }

    setCreating(true)

    try {
      await createTeam({
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      })

      setTeamName('')
      setTeamDescription('')
      setCreateModalOpen(false)
      setWorkspaceOpen(false)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to create workspace.'))
    } finally {
      setCreating(false)
    }
  }

  const handleLogout = async () => {
    setLogoutError('')
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setLogoutError(getApiErrorMessage(err, 'Unable to log out. Please try again.'))
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <aside className="flex h-screen w-64 shrink-0 flex-col bg-[#14251D] px-4 py-6 text-white">
        {/* Brand */}
        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-[#14251D]">
            <Layers3 size={22} strokeWidth={2.5} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">DevTrack</h1>
            <p className="text-[10px] tracking-[0.2em] text-slate-400">
              BUILD TOGETHER
            </p>
          </div>
        </div>

        {/* Workspace selector */}
        <div className="relative mb-8">
          <button
            type="button"
            onClick={() => setWorkspaceOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
            aria-expanded={workspaceOpen}
            aria-label="Select workspace"
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Workspace
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {loading
                  ? 'Loading workspaces...'
                  : activeTeam?.name ?? 'No workspace yet'}
              </p>
            </div>

            {loading ? (
              <LoaderCircle
                size={16}
                className="shrink-0 animate-spin text-slate-400"
              />
            ) : (
              <ChevronDown
                size={16}
                className={`shrink-0 text-slate-400 transition ${
                  workspaceOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {workspaceOpen && (
            <div className="absolute left-0 top-full z-30 mt-2 w-full rounded-xl border border-white/10 bg-[#20362B] p-2 shadow-xl">
              <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Your workspaces
              </p>

              {loading ? (
                <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-400">
                  <LoaderCircle size={14} className="animate-spin" />
                  Loading workspaces...
                </div>
              ) : teams.length > 0 ? (
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {teams.map((team: Team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        selectTeam(team.id)
                        setWorkspaceOpen(false)
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      <span className="truncate">{team.name}</span>
                      {activeTeamId === team.id && (
                        <Check
                          size={16}
                          className="shrink-0 text-lime-300"
                        />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-2 py-3 text-xs text-slate-400">
                  You haven't joined a workspace yet.
                </p>
              )}

              <div className="my-2 border-t border-white/10" />

              <button
                type="button"
                onClick={() => {
                  setWorkspaceOpen(false)
                  setCreateModalOpen(true)
                  setFormError('')
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-lime-300 transition hover:bg-white/10"
              >
                <Plus size={16} />
                Create workspace
              </button>

              {error && (
                <p className="px-2 py-2 text-xs text-red-300">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </div>

        <nav className="space-y-1">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard size={18} />
            Overview
          </NavLink>

          <NavLink to="/projects" className={navClass}>
            <FolderKanban size={18} />
            Projects
          </NavLink>

          <NavLink to="/tasks" className={navClass}>
            <CheckSquare size={18} />
            My Tasks
          </NavLink>
        </nav>

        {/* Team navigation */}
        <div className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Collaboration
        </div>

        <NavLink to="/team" className={navClass}>
          <Users size={18} />
          Team
        </NavLink>

        {/* Profile */}
        <div className="mt-auto border-t border-white/10 pt-5">
          {logoutError && (
            <p role="alert" className="mb-2 text-xs text-red-300">
              {logoutError}
            </p>
          )}
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-300 font-bold text-[#14251D]">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {user?.fullName ?? 'User'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email ?? ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              title="Log out"
              aria-label="Log out"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Create workspace modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-workspace-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2
                  id="create-workspace-title"
                  className="text-xl font-bold"
                >
                  Create a workspace
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bring your team and projects together.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label
                  htmlFor="workspace-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Workspace name
                </label>
                <input
                  id="workspace-name"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="e.g. Product Development"
                  maxLength={100}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#315B43] focus:ring-2 focus:ring-[#315B43]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="workspace-description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description
                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>
                </label>
                <textarea
                  id="workspace-description"
                  value={teamDescription}
                  onChange={(event) =>
                    setTeamDescription(event.target.value)
                  }
                  placeholder="What will your team work on?"
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#315B43] focus:ring-2 focus:ring-[#315B43]/10"
                />
              </div>

              {formError && (
                <p role="alert" className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={creating}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || teamName.trim().length < 2}
                  className="flex items-center gap-2 rounded-xl bg-[#14251D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#203D2E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {creating ? 'Creating...' : 'Create workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
