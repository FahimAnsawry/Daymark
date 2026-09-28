import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { taskKeys, type ProjectRow } from './tasks'

export type ProjectPerson = { id: number; name: string; email: string }

export type ProjectMembers = {
  owner: ProjectPerson
  members: ProjectPerson[]
  invitations: Array<{ id: number; email: string }>
}

export type InvitationDetails = {
  project: string
  invited_by: string
  email: string
  accepted: boolean
  is_for_you: boolean
}

const membersKey = (projectId: number) => ['projects', projectId, 'members'] as const

export function useProjectMembers(projectId: number | null) {
  return useQuery({
    queryKey: membersKey(projectId ?? 0),
    queryFn: async () => (await api.get<ProjectMembers>(`/projects/${projectId}/members`)).data,
    enabled: projectId !== null,
  })
}

/** After any change in who has access, refresh the member list, projects and tasks. */
function useRefreshSharing(projectId: number) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: membersKey(projectId) }),
      queryClient.invalidateQueries({ queryKey: taskKeys.projects }),
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks }),
    ])
}

export function useInviteToProject(projectId: number) {
  const refresh = useRefreshSharing(projectId)
  return useMutation({
    mutationFn: async (email: string) =>
      (await api.post(`/projects/${projectId}/invitations`, { email })).data,
    onSuccess: refresh,
  })
}

export function useCancelInvitation(projectId: number) {
  const refresh = useRefreshSharing(projectId)
  return useMutation({
    mutationFn: async (invitationId: number) =>
      api.delete(`/projects/${projectId}/invitations/${invitationId}`),
    onSuccess: refresh,
  })
}

/** The owner removes someone, or a member leaves (removes themselves). */
export function useRemoveMember(projectId: number) {
  const refresh = useRefreshSharing(projectId)
  return useMutation({
    mutationFn: async (userId: number) => api.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: refresh,
  })
}

export function useInvitation(token: string, enabled: boolean) {
  return useQuery({
    queryKey: ['invitations', token],
    queryFn: async () => (await api.get<InvitationDetails>(`/invitations/${token}`)).data,
    enabled,
    retry: false,
  })
}

export function useAcceptInvitation(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      (await api.post<{ data: ProjectRow }>(`/invitations/${token}/accept`)).data.data,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.projects }),
        queryClient.invalidateQueries({ queryKey: taskKeys.tasks }),
      ]),
  })
}

const PENDING_INVITE_KEY = 'daymark.pendingInvite'

/** Remembers an invitation opened while signed out, to reopen after signing in. */
export function rememberPendingInvite(token: string) {
  try {
    sessionStorage.setItem(PENDING_INVITE_KEY, token)
  } catch {
    // Storage unavailable; the email link still works after signing in.
  }
}

/** Returns (and forgets) an invitation opened while signed out, if any. */
export function takePendingInvite(): string | null {
  try {
    const token = sessionStorage.getItem(PENDING_INVITE_KEY)
    sessionStorage.removeItem(PENDING_INVITE_KEY)
    return token
  } catch {
    return null
  }
}

/** Everyone who can be assigned a task in a project: the owner and its members. */
export const assignablePeople = (members: ProjectMembers | undefined) =>
  members ? [members.owner, ...members.members] : []
