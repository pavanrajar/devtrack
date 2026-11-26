import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { LoaderCircle, Trash2, Users } from 'lucide-react'
import api, { getApiErrorMessage } from '../services/api'
import type { ApiResponse, TeamMember } from '../types/api'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useTeam } from '../features/teams/hooks/useTeam'

const Team = () => {
  const { activeTeam, activeTeamId, loading: teamLoading } = useTeam()
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadMembers = useCallback(async () => {
    if (!activeTeamId) {
      setMembers([])
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await api.get<ApiResponse<TeamMember[]>>(
        `/teams/${activeTeamId}/members`,
      )
      setMembers(response.data.data)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load team members.'))
    } finally {
      setLoading(false)
    }
  }, [activeTeamId])

  useEffect(() => {
    if (teamLoading) return
    const initialize = async () => {
      await Promise.resolve()
      void loadMembers()
    }
    void initialize()
  }, [loadMembers, teamLoading])

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeTeamId || !email.trim()) return
    setSaving(true)
    setError('')
    try {
      await api.post(`/teams/${activeTeamId}/members`, {
        email: email.trim(),
        role,
      })
      setEmail('')
      setRole('member')
      await loadMembers()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Unable to add this team member.'))
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (member: TeamMember) => {
    if (!activeTeamId || member.id === user?.id) return
    if (!window.confirm(`Remove ${member.full_name} from ${activeTeam?.name ?? 'this workspace'}?`)) return

    setSaving(true)
    setError('')
    try {
      await api.delete(`/teams/${activeTeamId}/members/${member.id}`)
      setMembers((current) => current.filter((item) => item.id !== member.id))
    } catch (removeError) {
      setError(getApiErrorMessage(removeError, 'Unable to remove this team member.'))
    } finally {
      setSaving(false)
    }
  }

  if (teamLoading || loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#7A857D]">
        <LoaderCircle size={18} className="animate-spin" /> Loading team...
      </div>
    )
  }

  if (!activeTeamId) {
    return (
      <section className="rounded-2xl border border-dashed border-[#D8DED4] bg-white px-6 py-12 text-center">
        <Users size={28} className="mx-auto text-[#526B59]" />
        <h1 className="mt-4 text-xl font-bold text-[#14251D]">No workspace selected</h1>
        <p className="mt-2 text-sm text-[#7A857D]">Create or select a workspace to manage its members.</p>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <section>
        <p className="text-sm font-medium text-[#7A857D]">Workspace / Team</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#14251D]">Team members</h1>
        <p className="mt-2 text-sm text-[#7A857D]">{activeTeam?.name} workspace access and roles.</p>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl border border-[#E7E9E3] bg-white p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#14251D]">Add a member</h2>
          <p className="mt-1 text-sm text-[#7A857D]">The person must already have a DevTrack account.</p>
        </div>
        <form onSubmit={handleAddMember} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@example.com"
            aria-label="Member email address"
            className="w-full rounded-xl border border-[#E7E9E3] bg-white px-3 py-2.5 text-sm text-[#26372C] outline-none focus:border-[#8DBB69] focus:ring-2 focus:ring-[#8DBB69]/20"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as 'admin' | 'member')}
            disabled={activeTeam?.role !== 'owner'}
            aria-label="Member role"
            className="rounded-xl border border-[#E7E9E3] bg-white px-3 py-2.5 text-sm text-[#26372C] disabled:bg-slate-50"
          >
            <option value="member">Member</option>
            {activeTeam?.role === 'owner' && <option value="admin">Admin</option>}
          </select>
          <button type="submit" disabled={saving || !email.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-[#14251D] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {saving && <LoaderCircle size={16} className="animate-spin" />} Add member
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E7E9E3] bg-white">
        <div className="flex items-center justify-between border-b border-[#EEF0EB] px-5 py-4">
          <div>
            <h2 className="font-bold text-[#14251D]">Workspace members</h2>
            <p className="mt-1 text-xs text-[#7A857D]">{members.length} {members.length === 1 ? 'person' : 'people'}</p>
          </div>
          <Users size={19} className="text-[#526B59]" />
        </div>
        {members.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#7A857D]">No team members found.</p>
        ) : (
          <ul className="divide-y divide-[#EEF0EB]">
            {members.map((member) => {
              const canRemove =
                member.id !== user?.id &&
                member.role !== 'owner' &&
                (activeTeam?.role === 'owner' || member.role === 'member')
              return (
                <li key={member.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#26372C]">{member.full_name}</p>
                    <p className="mt-1 truncate text-xs text-[#7A857D]">{member.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-[#EEF4E9] px-2.5 py-1 text-xs font-medium capitalize text-[#526B59]">{member.role}</span>
                    {canRemove && (
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
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export default Team
