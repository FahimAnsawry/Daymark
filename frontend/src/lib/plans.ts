export type BillingPeriod = 'monthly' | 'yearly'
export type PlanId = 'plus' | 'pro'
/** The plan a user is on, as sent by the API. Each tier includes the ones below it. */
export type PlanTier = 'free' | PlanId

const TIER_RANK: Record<PlanTier, number> = { free: 0, plus: 1, pro: 2 }

export const planIncludes = (plan: PlanTier, required: PlanTier) =>
  TIER_RANK[plan] >= TIER_RANK[required]

export type PlanFeature = {
  label: string
}

export type UpgradePlan = {
  id: PlanId
  name: string
  description: string
  /** Price per month, in whole US dollars, for each billing period. */
  monthlyPrice: Record<BillingPeriod, number>
  features: PlanFeature[]
}

export const TRIAL_DAYS = 7

export const FREE_PLAN = {
  name: 'Free',
  description: 'The essentials for planning your day.',
  features: ['Today view', 'Tasks and projects'],
}

export const PLANS: UpgradePlan[] = [
  {
    id: 'plus',
    name: 'Plus',
    description: 'For a steadier daily rhythm.',
    monthlyPrice: { monthly: 5, yearly: 4 },
    features: [
      { label: 'Gentle reminders and quiet hours' },
      { label: 'Focus sessions' },
      { label: 'Unlimited projects' },
      { label: 'Flexible daily views' },
      { label: 'Upcoming planning' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For a fuller, more considered week.',
    monthlyPrice: { monthly: 10, yearly: 8 },
    features: [
      { label: 'Everything in Plus' },
      { label: 'Shared projects' },
      { label: 'Reporting and weekly reflection' },
      { label: 'Filters and labels' },
      { label: 'Priority help when you need it' },
    ],
  },
]

/** Percentage saved by paying yearly instead of monthly. */
export const YEARLY_SAVING = Math.round(
  (1 - PLANS[0].monthlyPrice.yearly / PLANS[0].monthlyPrice.monthly) * 100,
)

export const isPlanId = (value: unknown): value is PlanId => PLANS.some((plan) => plan.id === value)

export const findPlan = (id: PlanId): UpgradePlan =>
  PLANS.find((plan) => plan.id === id) ?? PLANS[0]

/** Screen-reader suffix for controls that open the upgrade dialog instead of the feature. */
export const lockedSuffix = (plan: PlanId) => ` (part of Daymark ${findPlan(plan).name})`

/** The amount charged when the trial ends: one month, or twelve months up front. */
export const firstChargeFor = (plan: UpgradePlan, period: BillingPeriod) =>
  period === 'monthly' ? plan.monthlyPrice.monthly : plan.monthlyPrice.yearly * 12

export const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Formats a local calendar date as YYYY-MM-DD for URLs. */
export const toDateParam = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

/** Parses a YYYY-MM-DD URL value as a local calendar date, or null when invalid. */
export const fromDateParam = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d)
  return date.getMonth() === m - 1 && date.getDate() === d ? date : null
}
