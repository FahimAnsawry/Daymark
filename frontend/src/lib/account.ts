import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from './api'
import type { User } from './auth-context'

export type ProfileInput = { name: string; email: string }

export type PasswordInput = {
  /** Not needed when the account has no password yet (it signed in with Google). */
  current_password?: string
  password: string
  password_confirmation: string
}

/** Puts a fresh user where `useAuth()` reads it. */
function useSaveUser() {
  const queryClient = useQueryClient()
  return (user: User) => queryClient.setQueryData(['auth', 'user'], user)
}

/** Saves the name and email. */
export function useUpdateProfile() {
  const saveUser = useSaveUser()
  return useMutation({
    mutationFn: async (input: ProfileInput) =>
      (await api.put<{ user: User }>('/auth/profile', input)).data.user,
    onSuccess: saveUser,
  })
}

/** Changes the password, or sets the first one for an account that signed in with Google. */
export function useChangePassword() {
  const saveUser = useSaveUser()
  return useMutation({
    mutationFn: async (input: PasswordInput) =>
      (await api.put<{ user: User }>('/auth/password', input)).data.user,
    onSuccess: saveUser,
  })
}

export function useUploadAvatar() {
  const saveUser = useSaveUser()
  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.append('avatar', file)
      const { data } = await api.post<{ user: User }>('/auth/avatar', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.user
    },
    onSuccess: saveUser,
  })
}

export function useRemoveAvatar() {
  const saveUser = useSaveUser()
  return useMutation({
    mutationFn: async () => (await api.delete<{ user: User }>('/auth/avatar')).data.user,
    onSuccess: saveUser,
  })
}

/** The first message per field from a Laravel 422 response, or an empty object. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError<{ errors?: Record<string, string[]> }>(error)) return {}
  const errors = error.response?.data?.errors ?? {}
  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, messages]) =>
      messages[0] ? [[field, messages[0]]] : [],
    ),
  )
}
