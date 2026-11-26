
import axios, { AxiosError } from 'axios'
import type { ApiErrorResponse } from '../types/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || error.message || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export const isUnauthorizedError = (error: unknown): boolean => {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 401
  )
}

export type { AxiosError }

export default api
