
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import api, { getApiErrorMessage } from '../services/api'
import { useAuth } from '../features/auth/hooks/useAuth'
import type { ApiResponse, Team } from '../types/api'
import {
  TeamContext,
  type CreateTeamPayload,
} from './team-context'

const ACTIVE_TEAM_KEY = 'devtrack_active_team'

interface TeamProviderProps {
  children: ReactNode
}

export const TeamProvider = ({ children }: TeamProviderProps) => {
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_TEAM_KEY),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshTeams = useCallback(async () => {
    setError(null)
    setLoading(true)

    try {
      const response = await api.get<ApiResponse<Team[]>>('/teams')
      const fetchedTeams = response.data.data

      setTeams(fetchedTeams)

      const savedTeamId = localStorage.getItem(ACTIVE_TEAM_KEY)
      const savedTeamExists = fetchedTeams.some(
        (team) => team.id === savedTeamId,
      )

      const selectedTeamId =
        savedTeamExists && savedTeamId
          ? savedTeamId
          : fetchedTeams[0]?.id ?? null

      setActiveTeamId(selectedTeamId)

      if (selectedTeamId) {
        localStorage.setItem(ACTIVE_TEAM_KEY, selectedTeamId)
      } else {
        localStorage.removeItem(ACTIVE_TEAM_KEY)
      }

      return fetchedTeams
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to load your teams.')
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createTeam = useCallback(async (payload: CreateTeamPayload) => {
    setError(null)

    try {
      const response = await api.post<ApiResponse<Team>>('/teams', payload)
      const newTeam = response.data.data

      setTeams((currentTeams) => {
        if (currentTeams.some((team) => team.id === newTeam.id)) {
          return currentTeams
        }

        return [...currentTeams, newTeam]
      })

      setActiveTeamId(newTeam.id)
      localStorage.setItem(ACTIVE_TEAM_KEY, newTeam.id)

      return newTeam
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to create the team.')
      setError(message)
      throw err
    }
  }, [])

  const selectTeam = useCallback((teamId: string) => {
    setActiveTeamId(teamId)
    localStorage.setItem(ACTIVE_TEAM_KEY, teamId)
  }, [])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    let cancelled = false

    const loadTeams = async () => {
      try {
        const response = await api.get<ApiResponse<Team[]>>('/teams')
        if (cancelled) return

        const fetchedTeams = response.data.data
        setTeams(fetchedTeams)

        const savedTeamId = localStorage.getItem(ACTIVE_TEAM_KEY)
        const savedTeamExists = fetchedTeams.some(
          (team) => team.id === savedTeamId,
        )

        const selectedTeamId =
          savedTeamExists && savedTeamId
            ? savedTeamId
            : fetchedTeams[0]?.id ?? null

        setActiveTeamId(selectedTeamId)

        if (selectedTeamId) {
          localStorage.setItem(ACTIVE_TEAM_KEY, selectedTeamId)
        } else {
          localStorage.removeItem(ACTIVE_TEAM_KEY)
        }

        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Unable to load your teams.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadTeams()

    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated])

  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) ?? null,
    [teams, activeTeamId],
  )

  return (
    <TeamContext.Provider
      value={{
        teams,
        activeTeam,
        activeTeamId,
        loading,
        error,
        createTeam,
        selectTeam,
        refreshTeams,
      }}
    >
      {children}
    </TeamContext.Provider>
  )
}

export default TeamProvider
