
import { createContext } from 'react'
import type { User } from '../types/api'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  fullName: string
  email: string
  password: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<
  AuthContextType | undefined
>(undefined)
