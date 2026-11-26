
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import axios from 'axios'
import api from '../services/api'
import type {
  ApiResponse,
  AuthResult,
  User,
} from '../types/api'
import { AuthContext } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async () => {
    await api.post('/auth/logout')
    setUser(null)
  }, [])

  const login = useCallback(async (payload: {
    email: string
    password: string
  }) => {
    const response = await api.post<ApiResponse<AuthResult>>(
      '/auth/login',
      payload,
    )

    setUser(response.data.data.user)
  }, [])

  const register = useCallback(async (payload: {
    fullName: string
    email: string
    password: string
  }) => {
    const response = await api.post<ApiResponse<AuthResult>>(
      '/auth/register',
      payload,
    )

    setUser(response.data.data.user)
  }, [])

  useEffect(() => {
    const restoreSession = async () => {
      const legacyToken = localStorage.getItem('devtrack_token')

      try {
        const response = await api.get<ApiResponse<User>>('/auth/me', {
          ...(legacyToken
            ? { headers: { Authorization: `Bearer ${legacyToken}` } }
            : {}),
        })
        if (legacyToken) localStorage.removeItem('devtrack_token')
        setUser(response.data.data)
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('devtrack_token')
        } else {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }

    void restoreSession()
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
