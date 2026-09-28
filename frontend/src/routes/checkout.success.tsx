import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, CreditCard, Printer } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { BrandMark } from '../components/BrandMark'
import { LoadingPage } from '../components/LoadingPage'
import type { CardSummary } from '../components/StripeCheckout'
import { useAuth } from '../lib/auth-context'
import {
  TRIAL_DAYS,
  addDays,
  findPlan,
  firstChargeFor,
  fromDateParam,
  isPlanId,
  toDateParam,
  type BillingPeriod,
  type PlanId,
} from '../lib/plans'

type SuccessSearch = {
  plan: PlanId
  period: BillingPeriod
  start: string
  brand?: CardSummary['brand']
  last4?: string
}

const CARD_BRANDS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
} as const

export const Route = createFileRoute('/checkout/success')({
  validateSearch: (search: Record<string, unknown>): SuccessSearch => ({
    plan: isPlanId(search.plan) ? search.plan : 'pro',
    period: search.period === 'yearly' ? 'yearly' : 'monthly',
    start: fromDateParam(search.start) ? String(search.start) : toDateParam(new Date()),
    brand:
      typeof search.brand === 'string' && search.brand in CARD_BRANDS
        ? (search.brand as keyof typeof CARD_BRANDS)
        : undefined,
    last4: parseLast4(search.last4),
  }),
  component: CheckoutSuccessPage,
})

// The router parses a bare `last4=4242` as the number 4242, so accept both forms.
function parseLast4(value: unknown) {
  const digits =
    typeof value === 'number' && Number.isInteger(value) && value >= 0
      ? String(value).padStart(4, '0')
      : value
  return typeof digits === 'string' && /^\d{4}$/.test(digits) ? digits : undefined
}

const money = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const shortDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

const longDate = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

function CheckoutSuccessPage() {
  const { plan: planId, period, start, brand, last4 } = Route.useSearch()
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const plan = findPlan(planId)
  const amount = firstChargeFor(plan, period)
  const periodWord = period === 'yearly' ? 'year' : 'month'

  const { days, chargeDate } = useMemo(() => {
    const first = fromDateParam(start) ?? new Date()
    return {
      days: Array.from({ length: TRIAL_DAYS }, (_, i) => addDays(first, i)),
      chargeDate: addDays(first, TRIAL_DAYS),
    }
  }, [start])
  const lastTrialDay = days[days.length - 1]

  useEffect(() => {
    if (!isLoading && !isAuthenticated) void navigate({ to: '/login' })
  }, [isLoading, isAuthenticated, navigate])

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Thank you · Daymark ${plan.name}`
    return () => {
      document.title = previousTitle
    }
  }, [plan.name])

  // Arriving from checkout is a page change; start screen readers at the confirmation.
  useEffect(() => {
    if (isAuthenticated) headingRef.current?.focus()
  }, [isAuthenticated])

  if (isLoading) return <LoadingPage />
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-app-background text-[#1f2937] selection:bg-orange-200 selection:text-[#1f2937] dark:text-[#f3f4f6] dark:selection:bg-orange-400/35 dark:selection:text-white">
      <header className="mx-auto flex max-w-[1080px] items-center justify-between px-5 pt-6 md:px-8 print:hidden">
        <Link
          to="/dashboard"
          className="group flex items-center gap-2.5 rounded-lg font-logo text-[0.95rem] font-bold uppercase tracking-[0.08em] text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
        >
          <BrandMark />
          Daymark
        </Link>
      </header>

      <main className="mx-auto grid max-w-[1080px] grid-cols-[minmax(0,1fr)_380px] items-start gap-x-16 gap-y-10 px-5 pb-20 pt-14 md:px-8 max-[900px]:grid-cols-1 max-[900px]:pt-10 print:block print:pt-0">
        <div className="max-w-[560px]">
          <BrandMark size="lg" className="text-[#1f2937] dark:text-[#f3f4f6]" />

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="m-0 mt-7 font-display text-[clamp(2.1rem,4.6vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-balance outline-none"
          >
            Thank you. Your {plan.name} trial has begun.
          </h1>
          <p className="m-0 mt-5 max-w-[46ch] text-[1.05rem] leading-[1.6] text-[#4b5563] dark:text-[#c9ced6]">
            Everything in Daymark {plan.name} is open to you for the next {TRIAL_DAYS} days. Nothing
            is charged until {longDate(chargeDate)}, and you can cancel any time before then.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 print:hidden">
            <Link
              to="/dashboard"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full btn-primary px-6 text-[0.95rem] font-bold no-underline shadow-[0_6px_18px_rgba(194,65,12,0.28)] transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_10px_24px_rgba(194,65,12,0.32)] active:translate-y-0 dark:shadow-[0_6px_18px_rgba(0,0,0,0.4)] motion-reduce:hover:translate-y-0 max-[420px]:w-full"
            >
              Go to today’s plan
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-1 py-2 text-[0.9rem] font-medium text-[#667085] underline-offset-4 hover:text-[#1f2937] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-[#a7b0bf] dark:hover:text-[#f3f4f6]"
            >
              <Printer size={16} aria-hidden="true" />
              Print receipt
            </button>
          </div>
        </div>

        <Receipt
          planName={plan.name}
          period={period}
          amount={amount}
          periodWord={periodWord}
          firstDay={days[0]}
          lastTrialDay={lastTrialDay}
          chargeDate={chargeDate}
          brand={brand}
          last4={last4}
        />
      </main>
    </div>
  )
}

function Receipt({
  planName,
  period,
  amount,
  periodWord,
  firstDay,
  lastTrialDay,
  chargeDate,
  brand,
  last4,
}: {
  planName: string
  period: BillingPeriod
  amount: number
  periodWord: string
  firstDay: Date
  lastTrialDay: Date
  chargeDate: Date
  brand?: CardSummary['brand']
  last4?: string
}) {
  return (
    <aside
      aria-labelledby="receipt-title"
      className="rounded-2xl bg-[#f7f6f2] p-7 dark:bg-[#262626] max-[900px]:max-w-[560px] max-[420px]:p-5 print:bg-transparent print:p-0"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="receipt-title"
          className="m-0 font-display text-[1.15rem] font-semibold tracking-[-0.02em]"
        >
          Receipt
        </h2>
        <span className="rounded-full bg-[#ffde92] px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.04em] text-[#983705]">
          Test mode
        </span>
      </div>

      <dl className="m-0 mt-5 grid gap-4 border-t border-[#e2e4e0] pt-5 text-[0.88rem] leading-[1.45] dark:border-[#383838]">
        <ReceiptRow label="Plan">
          <span className="font-semibold">Daymark {planName}</span>
          <span className="block text-[#667085] dark:text-[#a7b0bf]">
            Billed {period === 'yearly' ? 'yearly' : 'monthly'}
          </span>
        </ReceiptRow>
        <ReceiptRow label="Free trial">
          <span className="font-semibold">{TRIAL_DAYS} days</span>
          <span className="block tabular-nums text-[#667085] dark:text-[#a7b0bf]">
            {shortDate(firstDay)} – {shortDate(lastTrialDay)}
          </span>
        </ReceiptRow>
        {last4 && (
          <ReceiptRow label="Payment method">
            <span className="inline-flex items-center gap-2 font-semibold">
              <CreditCard
                size={16}
                aria-hidden="true"
                className="text-[#667085] dark:text-[#a7b0bf]"
              />
              {brand ? CARD_BRANDS[brand] : 'Card'}
              <span className="tabular-nums">
                <span aria-hidden="true">•••• </span>
                <span className="sr-only">ending in </span>
                {last4}
              </span>
            </span>
          </ReceiptRow>
        )}
      </dl>

      <dl className="m-0 mt-5 grid gap-2 border-t border-[#e2e4e0] pt-5 dark:border-[#383838]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[0.95rem] font-semibold">Due today</dt>
          <dd className="m-0 font-display text-[1.9rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
            {money(0)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 text-[0.85rem] text-[#667085] dark:text-[#a7b0bf]">
          <dt>From {shortDate(chargeDate)}</dt>
          <dd className="m-0 tabular-nums">
            {money(amount)} / {periodWord}
          </dd>
        </div>
      </dl>

      <p className="m-0 mt-6 text-[0.78rem] leading-[1.5] text-[#6b7280] dark:text-[#9ca3af]">
        This checkout ran in Stripe test mode. No real payment was taken and no card was charged.
      </p>
    </aside>
  )
}

function ReceiptRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 max-[420px]:grid-cols-1 max-[420px]:gap-0.5">
      <dt className="text-[#667085] dark:text-[#a7b0bf]">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  )
}
