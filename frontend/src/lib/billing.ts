import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from './api'
import type { User } from './auth-context'
import type { CardSummary } from '../components/StripeCheckout'
import type { BillingPeriod, PlanId, PlanTier } from './plans'

/** Billing is simulated: the API records plans locally and nothing is ever charged. */
export type BillingStatus = {
  plan: PlanTier
  status: 'trialing' | 'active' | 'canceled' | 'ended' | null
  period: BillingPeriod | null
  on_trial: boolean
  trial_ends_at: string | null
  ends_at: string | null
  card_brand: CardSummary['brand'] | null
  card_last4: string | null
}

export const billingKey = ['billing'] as const

/** The API's message for a failed request, or a fallback. */
export const errorMessage = (error: unknown, fallback: string) =>
  (isAxiosError<{ message?: string }>(error) && error.response?.data?.message) || fallback

/** The API answers 402 when a feature needs a higher plan. */
export const isUpgradeRequired = (error: unknown) =>
  isAxiosError(error) && error.response?.status === 402

export function useBilling() {
  return useQuery({
    queryKey: billingKey,
    queryFn: async () => (await api.get<BillingStatus>('/billing')).data,
  })
}

/** A plan change affects the user payload (its `plan`) and anything gated by it. */
function applyBillingChange(queryClient: QueryClient, status: BillingStatus) {
  queryClient.setQueryData(billingKey, status)
  void queryClient.invalidateQueries({ queryKey: ['auth', 'user'] })
  void queryClient.invalidateQueries({ queryKey: ['reports'] })
}

export function useSubscribe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { plan: PlanId; period: BillingPeriod; card: CardSummary }) => {
      try {
        const { data } = await api.post<BillingStatus>('/billing/checkout', {
          plan: input.plan,
          period: input.period,
          card_brand: input.card.brand ?? null,
          card_last4: input.card.last4,
        })
        return data
      } catch (error) {
        throw new Error(errorMessage(error, 'We couldn’t start your trial. Please try again.'))
      }
    },
    onSuccess: (status) => applyBillingChange(queryClient, status),
  })
}

/** Switch between Plus and Pro, keeping the period, card and any remaining trial. */
export function useChangePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (plan: PlanId) =>
      (await api.post<BillingStatus>('/billing/change', { plan })).data,
    onSuccess: (status) => applyBillingChange(queryClient, status),
  })
}

export function useCancelPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post<BillingStatus>('/billing/cancel')).data,
    onSuccess: (status) => applyBillingChange(queryClient, status),
  })
}

/** Immediately cancel / end the free trial (temporary dev helper). */
export function useCancelTrial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post<BillingStatus>('/billing/cancel-trial')).data,
    onSuccess: (status) => applyBillingChange(queryClient, status),
  })
}

export type Preferences = {
  timezone?: string
  weekly_recap?: boolean
  quiet_hours_start?: string | null
  quiet_hours_end?: string | null
  morning_digest?: boolean
  evening_winddown?: boolean
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (preferences: Preferences) =>
      (await api.put<{ user: User }>('/auth/preferences', preferences)).data.user,
    onSuccess: (user) => queryClient.setQueryData(['auth', 'user'], user),
  })
}
