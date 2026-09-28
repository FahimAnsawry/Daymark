import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

export interface UserAccount {
  id: number
  user_id: number
  provider: 'password' | 'google' | 'github' | string
  provider_id?: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string | null
  accounts?: UserAccount[]
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string, user?: User) => Promise<void>
  register: (token: string, user?: User) => Promise<void>
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlToken = new URLSearchParams(window.location.search).get('token')
      if (urlToken) {
        localStorage.setItem('auth_token', urlToken)
        return urlToken
      }
      return localStorage.getItem('auth_token')
    }
    return null
  })

  const {
    data: user,
    isLoading: isUserLoading,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) return null
      try {
        const response = await api.get('/auth/me')
        return (response.data.user as User) ?? null
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('auth_token')
          setToken(null)
        }
        return null
      }
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  const login = useCallback(
    async (newToken: string, userData?: User) => {
      localStorage.setItem('auth_token', newToken)
      setToken(newToken)
      if (userData) {
        queryClient.setQueryData(['auth', 'user'], userData)
      } else {
        await refetch()
      }
    },
    [queryClient, refetch],
  )

  const registerUser = useCallback(
    async (newToken: string, userData?: User) => {
      localStorage.setItem('auth_token', newToken)
      setToken(newToken)
      if (userData) {
        queryClient.setQueryData(['auth', 'user'], userData)
      } else {
        await refetch()
      }
    },
    [queryClient, refetch],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore network / auth errors during logout
    } finally {
      localStorage.removeItem('auth_token')
      setToken(null)
      queryClient.setQueryData(['auth', 'user'], null)
      queryClient.removeQueries({ queryKey: ['auth'] })
    }
  }, [queryClient])

  const refetchUser = useCallback(async () => {
    await refetch()
  }, [refetch])

  const updateUser = useCallback(
    (updatedUser: User) => {
      queryClient.setQueryData(['auth', 'user'], updatedUser)
    },
    [queryClient],
  )

  const isLoading = !!token && isUserLoading
  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated,
        login,
        register: registerUser,
        logout,
        refetchUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
