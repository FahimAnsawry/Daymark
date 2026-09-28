import { useNavigate } from '@tanstack/react-router'
import { Check, ShieldCheck, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import {
  FREE_PLAN,
  PLANS,
  TRIAL_DAYS,
  YEARLY_SAVING,
  addDays,
  firstChargeFor,
  findPlan,
  toDateParam,
  type BillingPeriod,
  type PlanId,
  type UpgradePlan,
} from '../lib/plans'
import { StripeCheckout } from './StripeCheckout'

const formatDay = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

type Props = {
  onClose: () => void
}

export function UpgradeDialog({ onClose }: Props) {
  const [period, setPeriod] = useState<BillingPeriod>('yearly')
  const [planId, setPlanId] = useState<PlanId>('pro')
  const [step, setStep] = useState<'plans' | 'checkout'>('plans')
  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
  }, [step])
  const dialogRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const titleId = useId()
  const descriptionId = useId()

  const plan = findPlan(planId)
  const { trialDays, chargeDate } = useMemo(() => {
    const today = new Date()
    return {
      trialDays: Array.from({ length: TRIAL_DAYS }, (_, i) => addDays(today, i)),
      chargeDate: addDays(today, TRIAL_DAYS),
    }
  }, [])
  const firstCharge = firstChargeFor(plan, period)

  // Focus management: move focus in, trap Tab, close on Escape, restore on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (stepRef.current === 'checkout') setStep('plans')
        else onClose()
        return
      }
      const dialog = dialogRef.current
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  const isFirstStep = useRef(true)
  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false
      return
    }
    dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
  }, [step])

  if (step === 'checkout') {
    return (
      <StripeCheckout
        containerRef={dialogRef}
        titleId={titleId}
        planName={plan.name}
        period={period}
        amount={firstCharge}
        trialDays={TRIAL_DAYS}
        chargeDate={chargeDate}
        defaultEmail={user?.email ?? ''}
        onBack={() => setStep('plans')}
        onComplete={(card) =>
          void navigate({
            to: '/checkout/success',
            search: { plan: plan.id, period, start: toDateParam(trialDays[0]), ...card },
          })
        }
      />
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[#111827]/55 p-5 animate-dialog-fade-in max-[560px]:items-end max-[560px]:p-0 motion-reduce:animate-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-[960px] rounded-2xl bg-white text-[#1f2937] shadow-[0_28px_80px_rgba(17,24,39,0.28)] animate-modal-slide-up selection:bg-orange-200 selection:text-[#1f2937] dark:bg-[#262626] dark:text-[#f3f4f6] dark:shadow-[0_28px_80px_rgba(0,0,0,0.6)] dark:selection:bg-orange-400/35 dark:selection:text-white max-[560px]:max-h-[92dvh] max-[560px]:overflow-y-auto max-[560px]:rounded-b-none motion-reduce:animate-none"
      >
        <button
          type="button"
          className="absolute right-4 top-4 grid h-8 w-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[#667085] transition-colors duration-150 hover:bg-black/[0.06] hover:text-[#1f2937] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-[#a7b0bf] dark:hover:bg-white/[0.08] dark:hover:text-[#f3f4f6] dark:focus-visible:outline-orange-400"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={19} />
        </button>

        <form
          className="px-8 pb-7 pt-8 max-[560px]:px-5 max-[560px]:pb-5 max-[560px]:pt-7"
          onSubmit={(e) => {
            e.preventDefault()
            setStep('checkout')
          }}
        >
          <div className="flex items-end justify-between gap-6 pr-8 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-5 max-[640px]:pr-0">
            <div>
              <h2
                id={titleId}
                className="m-0 font-display text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-balance max-[560px]:pr-10 max-[560px]:text-[1.5rem]"
              >
                Give your days more room
              </h2>
              <div id={descriptionId} className="mt-3 grid gap-1.5">
                <p className="m-0 text-[0.98rem] font-medium leading-[1.45] text-[#1f2937] dark:text-[#f3f4f6]">
                  Enjoy{' '}
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {TRIAL_DAYS} days of full access, free
                  </span>{' '}
                  on Plus or Pro.
                </p>
                <p className="m-0 flex items-center gap-1.5 text-[0.82rem] leading-[1.45] text-[#667085] dark:text-[#a7b0bf]">
                  <ShieldCheck
                    size={15}
                    aria-hidden="true"
                    className="shrink-0 text-orange-600 dark:text-orange-400"
                  />
                  No charge during your trial. Cancel anytime before it ends.
                </p>
              </div>
            </div>
            <BillingToggle period={period} onChange={setPeriod} />
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3 max-[820px]:grid-cols-1 max-[560px]:mt-6">
            <FreePlanCard />
            <fieldset className="col-span-2 m-0 grid grid-cols-2 gap-3 border-0 p-0 max-[820px]:order-first max-[820px]:col-span-1 max-[560px]:grid-cols-1">
              <legend className="sr-only">Choose a plan to try</legend>
              {PLANS.map((p) => (
                <PlanOption
                  key={p.id}
                  plan={p}
                  period={period}
                  selected={p.id === planId}
                  onSelect={() => setPlanId(p.id)}
                />
              ))}
            </fieldset>
          </div>

          <TrialStrip
            days={trialDays}
            chargeDate={chargeDate}
            amount={firstCharge}
            period={period}
          />

          <div className="mt-6 flex items-center justify-between gap-4 max-[560px]:flex-col-reverse max-[560px]:items-stretch">
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent px-1 py-2 text-[0.85rem] font-medium text-[#667085] underline-offset-4 hover:text-[#1f2937] hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-[#a7b0bf] dark:hover:text-[#f3f4f6] dark:focus-visible:outline-orange-400"
              onClick={onClose}
            >
              Maybe later
            </button>
            <button
              type="submit"
              data-autofocus
              className="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-full border-0 btn-primary px-6 text-[0.9rem] font-bold shadow-[0_6px_18px_rgba(194,65,12,0.28)] transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_10px_24px_rgba(194,65,12,0.32)] active:translate-y-0 dark:shadow-[0_6px_18px_rgba(0,0,0,0.4)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              Start {TRIAL_DAYS}-day free trial of {plan.name}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod
  onChange: (period: BillingPeriod) => void
}) {
  return (
    <fieldset className="relative m-0 inline-flex shrink-0 rounded-full border border-[#d9dee7] bg-[#f7f6f2] p-1 dark:border-[#383838] dark:bg-[#1f1f1f]">
      <legend className="sr-only">Billing period</legend>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-1 top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-white shadow-[0_1px_3px_rgba(17,24,39,0.14)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-[#383838] dark:shadow-none motion-reduce:transition-none ${
          period === 'yearly' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />
      {(['monthly', 'yearly'] as const).map((value) => (
        <label
          key={value}
          className={`relative z-10 flex min-h-[34px] min-w-[104px] cursor-pointer select-none items-center justify-center gap-1.5 rounded-full px-3 text-[0.8rem] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-orange-500 ${
            period === value
              ? 'text-[#1f2937] dark:text-[#f3f4f6]'
              : 'text-[#667085] hover:text-[#1f2937] dark:text-[#a7b0bf] dark:hover:text-[#f3f4f6]'
          }`}
        >
          <input
            type="radio"
            name="billing-period"
            value={value}
            checked={period === value}
            onChange={() => onChange(value)}
            className="sr-only"
          />
          {value === 'monthly' ? 'Monthly' : 'Yearly'}
          {value === 'yearly' && (
            <span className="rounded-full bg-orange-100 px-1.5 py-px text-[0.66rem] font-bold text-orange-700 dark:bg-orange-400/15 dark:text-orange-300">
              −{YEARLY_SAVING}%
            </span>
          )}
        </label>
      ))}
    </fieldset>
  )
}

function FreePlanCard() {
  return (
    <section
      aria-label="Free plan, your current plan"
      className="flex flex-col rounded-xl bg-[#f7f6f2] p-5 dark:bg-[#1f1f1f]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="block font-display text-[1.2rem] font-semibold tracking-[-0.02em]">
            {FREE_PLAN.name}
          </span>
          <span className="mt-0.5 block text-[0.8rem] text-[#667085] dark:text-[#a7b0bf]">
            {FREE_PLAN.description}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-[#d9dee7] bg-white px-2 py-0.5 text-[0.68rem] font-semibold text-[#475467] dark:border-[#383838] dark:bg-[#262626] dark:text-[#c9ced6]">
          Current plan
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="font-display text-[2.1rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
          $0
        </span>
        <span className="text-[0.8rem] text-[#667085] dark:text-[#a7b0bf]">/ month</span>
      </div>
      <span className="mt-1.5 block min-h-[1.2em] text-[0.74rem] text-[#8a93a1] dark:text-[#8b93a0]">
        No card needed
      </span>

      <ul className="m-0 mt-5 grid list-none gap-2.5 border-t border-[#e2e4e0] p-0 pt-4 dark:border-[#383838]">
        {FREE_PLAN.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-[0.82rem] leading-[1.4] text-[#475467] dark:text-[#c9ced6]"
          >
            <Check
              size={15}
              aria-hidden="true"
              className="mt-[2px] shrink-0 text-[#98a2b3] dark:text-[#8b93a0]"
            />
            {feature}
          </li>
        ))}
      </ul>
    </section>
  )
}

function PlanOption({
  plan,
  period,
  selected,
  onSelect,
}: {
  plan: UpgradePlan
  period: BillingPeriod
  selected: boolean
  onSelect: () => void
}) {
  const price = plan.monthlyPrice[period]
  return (
    <label
      className={`group relative flex cursor-pointer flex-col rounded-xl border p-5 transition-[border-color,background-color,box-shadow] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-orange-500 motion-reduce:transition-none ${
        selected
          ? 'border-orange-500 bg-[#fff8f1] shadow-[0_0_0_1px_#f97316] dark:border-orange-400 dark:bg-orange-400/[0.07] dark:shadow-[0_0_0_1px_#fb923c]'
          : 'border-[#d9dee7] bg-white hover:border-[#b8c0cc] dark:border-[#383838] dark:bg-[#262626] dark:hover:border-[#4a4a4a]'
      }`}
    >
      <input
        type="radio"
        name="plan"
        value={plan.id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="block font-display text-[1.2rem] font-semibold tracking-[-0.02em]">
            {plan.name}
          </span>
          <span className="mt-0.5 block text-[0.8rem] text-[#667085] dark:text-[#a7b0bf]">
            {plan.description}
          </span>
        </div>
        <span
          aria-hidden="true"
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-150 ${
            selected
              ? 'border-orange-600 bg-orange-600 dark:border-orange-400 dark:bg-orange-400'
              : 'border-[#c4cad4] group-hover:border-[#98a2b3] dark:border-[#555]'
          }`}
        >
          {selected && (
            <Check size={12} strokeWidth={3} className="text-white dark:text-[#1f1f1f]" />
          )}
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span
          key={`${plan.id}-${period}`}
          className="font-display text-[2.1rem] font-semibold leading-none tracking-[-0.03em] tabular-nums animate-period-fade"
        >
          ${price}
        </span>
        <span className="text-[0.8rem] text-[#667085] dark:text-[#a7b0bf]">/ month</span>
      </div>
      <span className="mt-1.5 block min-h-[1.2em] text-[0.74rem] text-[#8a93a1] dark:text-[#8b93a0]">
        {period === 'yearly'
          ? `$${price * 12} billed yearly`
          : `or $${plan.monthlyPrice.yearly}/mo billed yearly`}
      </span>

      <ul className="m-0 mt-5 grid list-none gap-2.5 border-t border-[#e7eaef] p-0 pt-4 dark:border-[#383838]">
        {plan.features.map((feature) => (
          <li
            key={feature.label}
            className="flex items-start gap-2 text-[0.82rem] leading-[1.4] text-[#475467] dark:text-[#c9ced6]"
          >
            <Check
              size={15}
              aria-hidden="true"
              className="mt-[2px] shrink-0 text-orange-600 dark:text-orange-400"
            />
            {feature.label}
          </li>
        ))}
      </ul>
    </label>
  )
}

function TrialStrip({
  days,
  chargeDate,
  amount,
  period,
}: {
  days: Date[]
  chargeDate: Date
  amount: number
  period: BillingPeriod
}) {
  return (
    <section
      aria-label="How your free trial works"
      className="mt-5 rounded-xl bg-[#f7f6f2] px-5 py-4 dark:bg-[#1f1f1f]"
    >
      <ol className="m-0 grid list-none grid-cols-8 gap-1 p-0" aria-hidden="true">
        {days.map((day, i) => (
          <li key={day.toISOString()} className="flex flex-col items-center gap-1.5">
            <span
              className={`h-1.5 w-full rounded-full ${
                i === 0 ? 'bg-orange-600 dark:bg-orange-400' : 'bg-orange-300 dark:bg-orange-400/45'
              }`}
            />
            <span
              className={`text-[0.66rem] tabular-nums ${
                i === 0
                  ? 'font-bold text-orange-700 dark:text-orange-300'
                  : 'text-[#8a93a1] dark:text-[#8b93a0]'
              }`}
            >
              {day.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </span>
          </li>
        ))}
        <li className="flex flex-col items-center gap-1.5">
          <span className="h-1.5 w-full rounded-full bg-[#d9dee7] dark:bg-[#3a3a3a]" />
          <span className="text-[0.66rem] text-[#8a93a1] dark:text-[#8b93a0]">
            {chargeDate.toLocaleDateString(undefined, { weekday: 'narrow' })}
          </span>
        </li>
      </ol>
      <div className="mt-3 flex justify-between gap-4 text-[0.78rem] leading-[1.45] max-[420px]:flex-col max-[420px]:gap-1">
        <p className="m-0">
          <span className="font-semibold">Today</span>
          <span className="text-[#667085] dark:text-[#a7b0bf]"> · full access, $0</span>
        </p>
        <p className="m-0 text-right max-[420px]:text-left">
          <span className="font-semibold tabular-nums">{formatDay(chargeDate)}</span>
          <span className="text-[#667085] dark:text-[#a7b0bf]">
            {' '}
            · first charge of <span className="tabular-nums">${amount}</span>
            {period === 'yearly' ? ' for the year' : ''}
          </span>
        </p>
      </div>
    </section>
  )
}
