import { createContext } from 'react'
import type { Team } from '../types/api'

export interface CreateTeamPayload {
  name: string
  description?: string
}

export interface TeamContextType {
  teams: Team[]
  activeTeam: Team | null
  activeTeamId: string | null
  loading: boolean
  error: string | null
  createTeam: (payload: CreateTeamPayload) => Promise<Team>
  selectTeam: (teamId: string) => void
  refreshTeams: () => Promise<Team[]>
}

export const TeamContext = createContext<TeamContextType | undefined>(
  undefined,
)