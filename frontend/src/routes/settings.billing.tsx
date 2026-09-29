import { createFileRoute } from '@tanstack/react-router'
import { CalendarX2, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import {
  SettingsLayout,
  settingsMutedText as mutedText,
  settingsPanel as panel,
  settingsPrimaryButton as primaryButton,
  settingsQuietButton as quietButton,
} from '../components/SettingsLayout'
import { UpgradeDialog } from '../components/UpgradeDialog'
import {
  errorMessage,
  useBilling,
  useCancelPlan,
  useCancelTrial,
  useChangePlan,
  useUpdatePreferences,
  type BillingStatus,
} from '../lib/billing'
import { FREE_PLAN, findPlan, planIncludes } from '../lib/plans'

export const Route = createFileRoute('/settings/billing')({
  component: BillingSettingsPage,
})

const CARD_BRANDS = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' } as const

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })

function statusLine(billing: BillingStatus) {
  if (billing.status === 'trialing' && billing.trial_ends_at)
    return `Free trial until ${longDate(billing.trial_ends_at)}`
  if (billing.status === 'canceled' && billing.ends_at)
    return `Cancelled. You keep access until ${longDate(billing.ends_at)}.`
  if (billing.status === 'active')
    return `Billed ${billing.period === 'yearly' ? 'yearly' : 'monthly'}`
  return FREE_PLAN.description
}

function BillingSettingsPage() {
  const billing = useBilling()

  return (
    <SettingsLayout
      title="Billing"
      description="Billing in Daymark is simulated. No real payment is taken and no card is charged."
    >
      {(user) =>
        billing.isPending ? (
          <p className={`mt-10 text-sm ${mutedText}`} role="status">
            Loading your plan…
          </p>
        ) : billing.isError ? (
          <div className="mt-10 text-sm">
            <p>We couldn’t load your plan.</p>
            <button
              type="button"
              className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-orange-700 underline dark:text-orange-300"
              onClick={() => void billing.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <PlanPanel billing={billing.data} />
            <WeeklyRecapPanel
              isPro={planIncludes(billing.data.plan, 'pro')}
              enabled={user.weekly_recap ?? true}
              timezone={user.timezone}
            />
          </>
        )
      }
    </SettingsLayout>
  )
}

function PlanPanel({ billing }: { billing: BillingStatus }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const changePlan = useChangePlan()
  const cancelPlan = useCancelPlan()
  const cancelTrial = useCancelTrial()
  const isPaid = billing.plan !== 'free'
  const isTrial =
    billing.on_trial || billing.status === 'trialing' || (isPaid && billing.status === 'canceled')
  const canChange = isPaid && billing.status !== 'canceled'
  const otherPlan = billing.plan === 'pro' ? findPlan('plus') : findPlan('pro')
  const planName = isPaid ? findPlan(billing.plan as 'plus' | 'pro').name : FREE_PLAN.name
  const failure = changePlan.error ?? cancelPlan.error ?? cancelTrial.error

  return (
    <section aria-labelledby="plan-title" className={`${panel} mt-10`}>
      <p className={`m-0 text-[12px] font-semibold uppercase tracking-[0.06em] ${mutedText}`}>
        Your plan
      </p>
      <h2
        id="plan-title"
        className="m-0 mt-1.5 font-display text-[1.5rem] font-semibold tracking-[-0.02em]"
      >
        Daymark {planName}
      </h2>
      <p className={`m-0 mt-1 text-sm ${mutedText}`}>{statusLine(billing)}</p>

      {isPaid && billing.card_last4 && (
        <p className="m-0 mt-4 inline-flex items-center gap-2 text-sm">
          <CreditCard size={16} aria-hidden="true" className={mutedText} />
          {billing.card_brand ? CARD_BRANDS[billing.card_brand] : 'Card'}
          <span className="tabular-nums">
            <span aria-hidden="true">•••• </span>
            <span className="sr-only">ending in </span>
            {billing.card_last4}
          </span>
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {!isPaid && (
          <button
            type="button"
            aria-haspopup="dialog"
            className={primaryButton}
            onClick={() => setUpgradeOpen(true)}
          >
            See plans
          </button>
        )}
        {canChange && (
          <>
            <button
              type="button"
              className={primaryButton}
              disabled={changePlan.isPending}
              onClick={() => changePlan.mutate(otherPlan.id)}
            >
              {changePlan.isPending ? 'Switching…' : `Switch to ${otherPlan.name}`}
            </button>
            <button
              type="button"
              aria-haspopup="dialog"
              className={quietButton}
              disabled={cancelPlan.isPending}
              onClick={() => setConfirmCancel(true)}
            >
              Cancel plan
            </button>
          </>
        )}
        {isTrial && (
          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
            disabled={cancelTrial.isPending}
            onClick={() => cancelTrial.mutate()}
          >
            {cancelTrial.isPending ? 'Cancelling trial…' : 'Cancel free trial (temporary)'}
          </button>
        )}
      </div>

      {failure && (
        <p role="alert" className="m-0 mt-3 text-sm text-red-700 dark:text-red-300">
          {errorMessage(failure, 'Something went wrong. Please try again.')}
        </p>
      )}

      <ConfirmDeleteDialog
        isOpen={confirmCancel}
        title={`Cancel Daymark ${planName}?`}
        description={
          billing.on_trial
            ? 'You’ll keep everything until your trial ends, then move to the Free plan. Your tasks stay just as they are.'
            : 'You’ll move to the Free plan straight away. Your tasks stay just as they are.'
        }
        confirmLabel="Cancel plan"
        icon={CalendarX2}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false)
          cancelPlan.mutate()
        }}
      />
      {upgradeOpen && <UpgradeDialog onClose={() => setUpgradeOpen(false)} />}
    </section>
  )
}

function WeeklyRecapPanel({
  isPro,
  enabled,
  timezone,
}: {
  isPro: boolean
  enabled: boolean
  timezone?: string
}) {
  const updatePreferences = useUpdatePreferences()
  const checked = updatePreferences.isPending
    ? Boolean(updatePreferences.variables?.weekly_recap)
    : enabled

  return (
    <section aria-labelledby="recap-title" className={`${panel} mt-5`}>
      <h2
        id="recap-title"
        className="m-0 font-display text-[1.15rem] font-semibold tracking-[-0.02em]"
      >
        Weekly recap
      </h2>
      <p className={`m-0 mt-1.5 max-w-[52ch] text-sm leading-[1.55] ${mutedText}`}>
        A short email on Sunday evening about what you made room for this week.
        {timezone ? ` It arrives around 6pm, ${timezone.replace(/_/g, ' ')} time.` : ''}
      </p>
      {isPro ? (
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4 accent-orange-600"
            checked={checked}
            disabled={updatePreferences.isPending}
            onChange={(e) => updatePreferences.mutate({ weekly_recap: e.target.checked })}
          />
          Send me the weekly recap
        </label>
      ) : (
        <p className="m-0 mt-4 text-sm">The weekly recap is part of Daymark Pro.</p>
      )}
      {updatePreferences.isError && (
        <p role="alert" className="m-0 mt-2 text-sm text-red-700 dark:text-red-300">
          {errorMessage(updatePreferences.error, 'We couldn’t save that. Please try again.')}
        </p>
      )}
    </section>
  )
}
