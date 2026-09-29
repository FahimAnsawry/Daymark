import { useState, type CSSProperties } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { GuestOnly } from '../components/GuestOnly'
import { revealDelay, useReveal } from '../lib/reveal'
import {
  FREE_PLAN,
  PLANS as PAID_PLANS,
  TRIAL_DAYS,
  YEARLY_SAVING,
  type BillingPeriod,
} from '../lib/plans'

interface PricingPlan {
  name: string
  description: string
  /** Price per month, in whole US dollars, for each billing period. */
  monthlyPrice: Record<BillingPeriod, number>
  recommended?: boolean
  features: string[]
}

const PLANS: PricingPlan[] = [
  { ...FREE_PLAN, monthlyPrice: { monthly: 0, yearly: 0 } },
  ...PAID_PLANS.map((plan) => ({
    name: plan.name,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    recommended: plan.id === 'plus',
    features: plan.features.map((feature) => feature.label),
  })),
]

const COMPARISON_ROWS = [
  { label: 'Today view', values: ['Included', 'Included', 'Included'] },
  { label: 'Tasks and projects', values: ['Included', 'Included', 'Included'] },
  { label: 'Gentle reminders and quiet hours', values: ['—', 'Included', 'Included'] },
  { label: 'Focus sessions', values: ['—', 'Included', 'Included'] },
  { label: 'Unlimited projects', values: ['—', 'Included', 'Included'] },
  { label: 'Flexible daily views', values: ['—', 'Included', 'Included'] },
  { label: 'Upcoming planning', values: ['—', 'Included', 'Included'] },
  { label: 'Shared projects', values: ['—', '—', 'Included'] },
  { label: 'Reporting and weekly reflection', values: ['—', '—', 'Included'] },
  { label: 'Filters and labels', values: ['—', '—', 'Included'] },
  { label: 'Priority help', values: ['—', '—', 'Included'] },
  { label: 'Free trial', values: ['—', `${TRIAL_DAYS} days`, `${TRIAL_DAYS} days`] },
]

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
})

function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly')
  const revealRef = useReveal<HTMLElement>()

  return (
    <GuestOnly>
      <div className="min-h-screen text-[#1f2937] dark:text-[#f3f4f6] bg-app-background transition-colors duration-250">
        <Navbar variant="light" />

        <main ref={revealRef}>
          <section
            className="max-w-[1200px] mx-auto py-8 md:py-12 pb-[90px] md:pb-[120px] px-5.5 md:px-[5vw]"
            aria-labelledby="plans-title"
          >
            <div
              className="flex flex-col items-center text-center max-w-[820px] mx-auto mb-9 md:mb-[52px]"
              data-reveal="pending"
            >
              <h1
                id="plans-title"
                className="reveal-rise m-0 mb-4 text-[#1f2937] dark:text-[#f2f4ee] font-display text-[clamp(2.7rem,5vw,4.6rem)] font-semibold tracking-[-0.04em] leading-[1.02] text-center"
              >
                Choose your plan
              </h1>
              <p
                className="reveal-rise m-0 mb-7 max-w-[520px] text-[#667085] dark:text-[#a7b0bf] text-[0.95rem] leading-[1.55] text-balance"
                style={revealDelay(140)}
              >
                Start free. When you want more room, try Plus or Pro free for {TRIAL_DAYS} days.
              </p>

              <div
                className="reveal-rise flex flex-col items-center gap-2.5 w-full max-w-[280px] md:max-w-none mx-auto"
                style={revealDelay(260)}
              >
                <fieldset
                  className="relative inline-flex w-full md:w-[228px] p-1 border border-[#c7cfc2] dark:border-[#383838] rounded-full bg-white/50 dark:bg-[#111a17] box-border"
                  aria-label="Billing period"
                >
                  <legend className="sr-only">Billing period</legend>
                  <div
                    className={`pointer-events-none absolute left-1 top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-[#c2410c] shadow-[0_2px_8px_rgba(49,88,68,0.24)] transition-transform duration-300 ease-out dark:bg-[#fed7aa] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${
                      billingPeriod === 'monthly' ? 'translate-x-0' : 'translate-x-full'
                    }`}
                    aria-hidden="true"
                  />
                  {(['monthly', 'yearly'] as const).map((period) => (
                    <label
                      key={period}
                      className={`relative z-10 grid flex-1 min-h-[42px] place-items-center rounded-full text-[0.78rem] font-bold cursor-pointer transition-colors select-none ${
                        billingPeriod === period
                          ? 'text-white dark:text-[#1f2937]'
                          : 'text-[#667085] dark:text-[#a7b0bf] hover:text-[#1f2937] dark:hover:text-[#f3f4f6]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="billing-period"
                        value={period}
                        checked={billingPeriod === period}
                        onChange={() => setBillingPeriod(period)}
                        className="absolute opacity-0 pointer-events-none"
                      />
                      <span className="inline-flex items-center gap-1.5">
                        {period === 'monthly' ? 'Monthly' : 'Yearly'}
                        {period === 'yearly' && (
                          <span
                            className={`rounded-full px-1.5 py-px text-[0.62rem] font-bold transition-colors ${
                              billingPeriod === 'yearly'
                                ? 'bg-white/20 text-[#f7f6f2] dark:bg-[#1f2937]/12 dark:text-[#1f2937]'
                                : 'bg-[#ea580c]/10 text-[#c2410c] dark:bg-[#fed7aa]/12 dark:text-[#fed7aa]'
                            }`}
                          >
                            −{YEARLY_SAVING}%
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </fieldset>
                <p
                  className="m-0 text-[#8b958c] dark:text-[#8a988d] text-[0.68rem] transition-opacity duration-200"
                  aria-live="polite"
                >
                  No charge during your trial · cancel anytime
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-[17px] items-stretch">
              {PLANS.map((plan, planIndex) => (
                <article
                  data-reveal="pending"
                  style={{ '--card-index': planIndex } as CSSProperties}
                  className={`reveal-card ${plan.recommended ? 'reveal-lift' : 'reveal-rise'} relative flex flex-col min-h-0 md:min-h-[500px] p-[28px_23px_24px] md:p-[32px_28px_28px] border transition-colors ${
                    plan.recommended
                      ? 'border-[#ea580c] dark:border-[#9a3412] bg-[#fed7aa] text-[#1f2937] dark:bg-[#fed7aa] dark:text-[#1f2937] shadow-[0_18px_40px_rgba(31,41,55,0.16)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]'
                      : 'border-[#c7cfc2] dark:border-[#383838] bg-white/28 dark:bg-[#111a17]'
                  }`}
                  key={plan.name}
                >
                  {plan.recommended && (
                    <span className="absolute -top-3 left-6 rounded-full bg-[#1f2937] px-2.5 py-1 text-[0.62rem] font-bold tracking-[0.03em] text-[#fed7aa] dark:bg-[#1f2937] dark:text-[#fed7aa]">
                      Recommended
                    </span>
                  )}
                  <p
                    className={`mb-4 text-[0.66rem] font-bold tracking-[0.09em] uppercase ${plan.recommended ? 'text-[#c2410c] dark:text-[#9a3412]' : 'text-[#ea580c] dark:text-[#fb923c]'}`}
                  >
                    {plan.monthlyPrice.monthly === 0
                      ? 'Always free'
                      : `${TRIAL_DAYS}-day free trial`}
                  </p>
                  <h3
                    className={`m-0 mb-3 font-display text-[1.85rem] font-semibold tracking-[-0.04em] ${plan.recommended ? 'text-[#1f2937] dark:text-[#1f2937]' : 'text-[#1f2937] dark:text-[#f2f4ee]'}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`min-h-0 md:min-h-[52px] m-0 text-[0.82rem] leading-[1.55] ${plan.recommended ? 'text-[#1f2937]/75 dark:text-[#1f2937]/76' : 'text-[#727b73] dark:text-[#a7b0bf]'}`}
                  >
                    {plan.description}
                  </p>
                  <div
                    className={`mt-7 flex items-baseline gap-1.5 ${plan.recommended ? 'text-[#1f2937] dark:text-[#1f2937]' : 'text-[#1f2937] dark:text-[#f2f4ee]'}`}
                  >
                    <span
                      key={billingPeriod}
                      className="font-display text-[2.4rem] font-semibold leading-none tracking-[-0.04em] tabular-nums animate-period-fade"
                    >
                      ${plan.monthlyPrice[billingPeriod]}
                    </span>
                    <span
                      className={`text-[0.78rem] ${plan.recommended ? 'text-[#1f2937]/65' : 'text-[#8b958c] dark:text-[#8a988d]'}`}
                    >
                      / month
                    </span>
                  </div>
                  <p
                    key={billingPeriod}
                    className={`mt-1.5 mb-6 text-[0.68rem] animate-period-fade ${plan.recommended ? 'text-[#1f2937]/65 dark:text-[#1f2937]/65' : 'text-[#8b958c] dark:text-[#8a988d]'}`}
                  >
                    {plan.monthlyPrice.monthly === 0
                      ? 'No card needed'
                      : billingPeriod === 'yearly'
                        ? `$${plan.monthlyPrice.yearly * 12} billed yearly`
                        : `or $${plan.monthlyPrice.yearly}/mo billed yearly`}
                  </p>
                  <Link
                    className={
                      plan.recommended
                        ? 'btn-primary-strong inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full text-[0.76rem] font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.35)]'
                        : 'inline-flex min-h-[44px] items-center justify-center gap-2 border border-[#c2410c] dark:border-[#fed7aa]/40 rounded-full text-[#c2410c] dark:text-[#fed7aa] bg-transparent dark:bg-[#fed7aa]/6 text-[0.76rem] font-bold transition-all duration-200 hover:text-white hover:bg-[#c2410c] dark:hover:bg-[#fed7aa] dark:hover:border-[#fed7aa] dark:hover:text-[#1f2937] dark:hover:shadow-[0_4px_14px_rgba(0,0,0,0.3)]'
                    }
                    to="/register"
                  >
                    {plan.monthlyPrice.monthly === 0 ? 'Start for free' : `Try ${plan.name} free`}{' '}
                    <ArrowRight size={16} />
                  </Link>
                  <ul
                    className={`grid gap-3 mt-[30px] md:mt-auto pt-7 border-t list-none p-0 ${plan.recommended ? 'border-[#c2410c]/20 dark:border-[#c2410c]/25' : 'border-[#c7cfc2] dark:border-[#383838]'}`}
                  >
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={feature}
                        style={revealDelay(320 + featureIndex * 70)}
                        className={`reveal-fade flex items-center gap-2 text-[0.75rem] ${
                          plan.recommended
                            ? 'text-[#1f2937]/85 dark:text-[#1f2937]/85 [&>svg]:shrink-0 [&>svg]:text-[#c2410c] dark:[&>svg]:text-[#9a3412]'
                            : 'text-[#667085] dark:text-[#a7b0bf] [&>svg]:shrink-0 [&>svg]:text-[#ea580c] dark:[&>svg]:text-[#fb923c]'
                        }`}
                      >
                        <Check size={15} /> {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section
            className="max-w-[1200px] mx-auto pt-0 pb-[90px] md:pb-[120px] px-5.5 md:px-[5vw]"
            aria-labelledby="comparison-title"
          >
            <div className="mb-7.5 md:mb-10.5" data-reveal="pending">
              <p className="reveal-fade mb-5 text-[#ea580c] dark:text-[#fb923c] text-[0.72rem] font-bold tracking-[0.08em] uppercase">
                At a glance
              </p>
              <h2
                id="comparison-title"
                style={revealDelay(120)}
                className="reveal-rise m-0 mb-4 text-[#1f2937] dark:text-[#f2f4ee] font-display text-[clamp(1.5rem,7vw,2.3rem)] sm:text-[clamp(2.7rem,5vw,4.6rem)] font-semibold tracking-[-0.04em] leading-[1.02] text-balance [&>em]:font-semibold [&>em]:text-[#64748b] dark:[&>em]:text-[#94a3b8] [&>em]:not-italic"
              >
                <span className="block sm:inline">A simple comparison,</span>
                <br className="hidden sm:block" />
                <em className="block sm:inline">without the small print.</em>
              </h2>
            </div>
            <div className="grid gap-4 lg:hidden">
              {PLANS.map((plan, planIndex) => (
                <article
                  key={plan.name}
                  data-reveal="pending"
                  style={{ '--card-index': planIndex } as CSSProperties}
                  className={`reveal-card reveal-rise border ${
                    plan.recommended
                      ? 'border-[#ea580c] bg-[#fed7aa]/30 dark:border-[#9a3412] dark:bg-[#fed7aa]/30'
                      : 'border-[#c7cfc2] bg-white dark:border-[#383838] dark:bg-[#111a17]'
                  }`}
                >
                  <h3
                    className={`m-0 border-b px-4 py-3 font-display text-[1.3rem] font-semibold tracking-[-0.03em] ${
                      plan.recommended
                        ? 'border-[#ea580c]/30 text-[#1f2937] dark:border-[#fed7aa]/20 dark:text-[#f7f6f2]'
                        : 'border-[#d4d9d0] text-[#1f2937] dark:border-[#383838] dark:text-[#f2f4ee]'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <dl className="m-0 px-4">
                    {COMPARISON_ROWS.map((row, rowIndex) => {
                      const value = row.values[planIndex]

                      return (
                        <div
                          key={row.label}
                          className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 text-[0.8rem] ${
                            rowIndex < COMPARISON_ROWS.length - 1
                              ? 'border-b border-[#d4d9d0] dark:border-[#383838]'
                              : ''
                          }`}
                        >
                          <dt className="min-w-0 text-[#4d5d51] dark:text-[#c5cec7]">
                            {row.label}
                          </dt>
                          <dd className="m-0 inline-flex items-center justify-end gap-1.5 text-right text-[#788279] dark:text-[#a7b0bf]">
                            {value === 'Included' ? (
                              <>
                                <Check
                                  size={15}
                                  aria-hidden="true"
                                  className="shrink-0 text-[#64748b] dark:text-[#94a3b8]"
                                />
                                <span className="sr-only">Included</span>
                              </>
                            ) : (
                              value
                            )}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </article>
              ))}
            </div>
            <div
              data-reveal="pending"
              className="reveal-fade hidden overflow-x-auto border-y border-[#d9dee7] dark:border-[#383838] focus-visible:outline-2 focus-visible:outline-[#ea580c] focus-visible:outline-offset-4 lg:block"
              tabIndex={0}
              aria-label="Scrollable plan comparison"
            >
              <table className="w-full min-w-[740px] border-collapse text-[0.78rem]">
                <caption className="sr-only">Daymark plan feature comparison</caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 z-10 bg-app-background p-[19px_18px] border-b border-[#d4d9d0] dark:border-[#383838] text-left text-[#1f2937] dark:text-[#f2f4ee] text-[0.72rem] font-bold"
                    >
                      What’s included
                    </th>
                    {PLANS.map((plan) => (
                      <th
                        scope="col"
                        className={`p-[19px_18px] border-b border-[#d4d9d0] dark:border-[#383838] text-left text-[#1f2937] dark:text-[#f2f4ee] text-[0.72rem] font-bold ${
                          plan.recommended
                            ? 'bg-[#fed7aa]/40 dark:bg-[#fed7aa]/30 border-t-3 border-[#ea580c] dark:border-[#94a3b8]'
                            : ''
                        }`}
                        key={plan.name}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, rowIndex) => (
                    <tr
                      key={row.label}
                      style={revealDelay(160 + rowIndex * 70)}
                      className={`reveal-rise ${
                        rowIndex === COMPARISON_ROWS.length - 1
                          ? '[&>th]:border-b-0 [&>td]:border-b-0'
                          : ''
                      }`}
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-app-background p-[19px_18px] border-b border-[#d4d9d0] dark:border-[#383838] text-left text-[#4d5d51] dark:text-[#c5cec7] font-medium"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, index) => (
                        <td
                          className={`p-[19px_18px] border-b border-[#d4d9d0] dark:border-[#383838] text-left text-[#788279] dark:text-[#a7b0bf] [&>svg]:text-[#64748b] dark:[&>svg]:text-[#94a3b8] [&>svg]:inline-block [&>svg]:align-middle ${
                            PLANS[index].recommended ? 'bg-[#fed7aa]/40 dark:bg-[#fed7aa]/30' : ''
                          }`}
                          key={`${row.label}-${index}`}
                        >
                          {value === 'Included' ? (
                            <>
                              <Check size={15} /> <span className="sr-only">Included</span>
                            </>
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            className="py-[92px] md:py-[120px] pb-[100px] md:pb-[132px] px-6 text-center bg-[#fed7aa] dark:bg-[#fed7aa] dark:border-t dark:border-[#c2410c]/30"
            aria-labelledby="pricing-closing-title"
            data-reveal="pending"
          >
            <p className="reveal-fade mb-5 text-[#ea580c] dark:text-[#9a3412] text-[0.72rem] font-bold tracking-[0.08em] uppercase">
              No pressure, just a beginning
            </p>
            <h2
              id="pricing-closing-title"
              style={revealDelay(120)}
              className="reveal-rise m-0 mb-7.5 text-[#1f2937] dark:text-[#1f2937] font-display text-[clamp(3rem,6vw,5.6rem)] font-semibold tracking-[-0.04em] leading-[1.02] [&>em]:font-semibold [&>em]:text-[#64748b] dark:[&>em]:text-[#9a3412] [&>em]:not-italic"
            >
              Start with today.
              <br />
              <em>Decide the rest later.</em>
            </h2>
            <div className="reveal-rise flex flex-col items-center gap-4" style={revealDelay(280)}>
              <Link
                className="inline-flex items-center gap-2.5 rounded-full text-[0.85rem] font-bold px-[21px] py-[15px] btn-primary-strong dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5"
                to="/register"
              >
                Start for free <ArrowRight size={17} />
              </Link>
              <Link
                className="inline-flex items-center gap-1.5 text-[#667085] dark:text-[#1f2937]/75 hover:text-[#ea580c] dark:hover:text-[#9a3412] text-[0.76rem] font-bold transition-colors"
                to="/login"
              >
                Already have an account? Log in
              </Link>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </GuestOnly>
  )
}
