import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import { Navbar } from '../components/Navbar'

type BillingPeriod = 'monthly' | 'yearly'

interface PricingPlan {
  name: string
  description: string
  recommended?: boolean
  features: string[]
}

const PLANS: PricingPlan[] = [
  {
    name: 'A quiet start',
    description: 'A simple place to begin making room for what matters.',
    features: ['Daily planning', 'Open-loop capture', 'Task organization'],
  },
  {
    name: 'A steadier rhythm',
    description: 'More room for the routines and projects that shape your days.',
    recommended: true,
    features: ['Daily planning', 'Open-loop capture', 'Task organization', 'Flexible daily views'],
  },
  {
    name: 'A considered practice',
    description: 'A thoughtful setup for a fuller, more intentional week.',
    features: ['Daily planning', 'Open-loop capture', 'Task organization', 'Flexible daily views'],
  },
]

const COMPARISON_ROWS = [
  { label: 'Daily planning', values: ['Included', 'Included', 'Included'] },
  { label: 'Open-loop capture', values: ['Included', 'Included', 'Included'] },
  { label: 'Task organization', values: ['Included', 'Included', 'Included'] },
  { label: 'Flexible daily views', values: ['—', 'Included', 'Included'] },
  { label: 'Plan details', values: ['Coming soon', 'Coming soon', 'Coming soon'] },
]

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
})

function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')

  return (
    <div className="min-h-screen text-[#27352f] dark:text-[#edebe4] bg-[#f4f1e9] dark:bg-[#111a17] transition-colors duration-250">
      <Navbar variant="light" />

      <main>
        <section className="max-w-[1200px] mx-auto py-8 md:py-12 pb-[90px] md:pb-[120px] px-5.5 md:px-[5vw]" aria-labelledby="plans-title">
          <div className="flex flex-col items-center text-center max-w-[820px] mx-auto mb-9 md:mb-[52px]">
            <p className="mb-5 text-[#b36d58] dark:text-[#e08a70] text-[0.72rem] font-bold tracking-[0.08em] uppercase">The shape of things to come</p>
            <h1 id="plans-title" className="m-0 mb-7 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[clamp(2.7rem,5vw,4.6rem)] font-normal tracking-[-0.055em] leading-[1.02] text-center [&>em]:font-normal [&>em]:text-[#6e8b72] dark:[&>em]:text-[#a7d0ab] [&>em]:not-italic">
              Plans with room<br /><em>to breathe.</em>
            </h1>

            <div className="flex flex-col items-center gap-2.5 w-full max-w-[280px] md:max-w-none mx-auto">
              <fieldset className="relative inline-flex w-full md:w-[228px] p-1 border border-[#c7cfc2] dark:border-[#253931] rounded-full bg-white/50 dark:bg-[#162420] box-border" aria-label="Billing period">
                <legend className="sr-only">Billing period</legend>
                <div
                  className="absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] rounded-full bg-[#315844] dark:bg-[#254b38] shadow-[0_2px_8px_rgba(49,88,68,0.24)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] pointer-events-none transition-transform duration-300 ease-out"
                  style={{
                    transform: billingPeriod === 'monthly' ? 'translateX(0%)' : 'translateX(100%)',
                  }}
                  aria-hidden="true"
                />
                {(['monthly', 'yearly'] as const).map((period) => (
                  <label
                    key={period}
                    className={`relative z-10 grid flex-1 min-h-[42px] place-items-center rounded-full text-[0.78rem] font-bold cursor-pointer transition-colors select-none ${
                      billingPeriod === period
                        ? 'text-[#f4f1e9]'
                        : 'text-[#6e776e] dark:text-[#9eaba1] hover:text-[#27352f] dark:hover:text-[#edebe4]'
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
                    <span>{period === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                  </label>
                ))}
              </fieldset>
              <p className="m-0 text-[#8b958c] dark:text-[#8a988d] text-[0.68rem] transition-opacity duration-200" aria-live="polite">
                Showing {billingPeriod} preview · no charges today
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-[17px] items-stretch">
            {PLANS.map((plan) => (
              <article
                className={`relative flex flex-col min-h-0 md:min-h-[500px] p-[28px_23px_24px] md:p-[32px_28px_28px] border transition-colors ${
                  plan.recommended
                    ? 'border-[#315844] dark:border-[#2f5643] text-[#f4f1e9] bg-[#315844] dark:bg-[#1c3b2d] shadow-[0_18px_40px_rgba(32,59,50,0.16)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]'
                    : 'border-[#c7cfc2] dark:border-[#253931] bg-white/28 dark:bg-[#162420]'
                }`}
                key={plan.name}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-6 px-2.5 py-1 rounded-full text-[#24352f] bg-[#e5efc4] text-[0.62rem] font-bold tracking-[0.03em]">
                    A considered fit
                  </span>
                )}
                <p className={`mb-4 text-[0.66rem] font-bold tracking-[0.09em] uppercase ${plan.recommended ? 'text-[#d5dfac]' : 'text-[#b36d58] dark:text-[#e08a70]'}`}>
                  Daymark plan
                </p>
                <h3 className={`m-0 mb-3 font-serif text-[1.85rem] font-normal tracking-[-0.04em] ${plan.recommended ? 'text-[#f4f1e9]' : 'text-[#27352f] dark:text-[#f2f4ee]'}`}>
                  {plan.name}
                </h3>
                <p className={`min-h-0 md:min-h-[52px] m-0 text-[0.82rem] leading-[1.55] ${plan.recommended ? 'text-[#f4f1e9]/75 dark:text-[#f4f1e9]/76' : 'text-[#727b73] dark:text-[#9eaba1]'}`}>
                  {plan.description}
                </p>
                <div className={`mt-7 font-serif text-[1.7rem] tracking-[-0.04em] ${plan.recommended ? 'text-[#f4f1e9]' : 'text-[#27352f] dark:text-[#f2f4ee]'}`} aria-label="Price coming soon">
                  Coming soon
                </div>
                <p
                  key={billingPeriod}
                  className={`mt-1 mb-6 text-[0.68rem] animate-[periodFade_0.24s_ease-out] ${plan.recommended ? 'text-[#f4f1e9]/65' : 'text-[#8b958c] dark:text-[#8a988d]'}`}
                >
                  {billingPeriod === 'monthly' ? 'Monthly preview' : 'Yearly preview'}
                </p>
                <Link
                  className={
                    plan.recommended
                      ? 'inline-flex min-h-[44px] items-center justify-center gap-2 border border-[#e5efc4] rounded-full text-[#24352f] dark:text-[#111a17] bg-[#e5efc4] text-[0.76rem] font-bold transition-all duration-200 hover:bg-[#f1f6d8] hover:border-[#f1f6d8] dark:hover:bg-[#f1f6d8] dark:hover:border-[#f1f6d8] dark:hover:text-[#111a17] dark:hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.35)]'
                      : 'inline-flex min-h-[44px] items-center justify-center gap-2 border border-[#315844] dark:border-[#e5efc4]/40 rounded-full text-[#315844] dark:text-[#e5efc4] bg-transparent dark:bg-[#e5efc4]/6 text-[0.76rem] font-bold transition-all duration-200 hover:text-[#f4f1e9] hover:bg-[#315844] dark:hover:bg-[#e5efc4] dark:hover:border-[#e5efc4] dark:hover:text-[#121917] dark:hover:shadow-[0_4px_14px_rgba(0,0,0,0.3)]'
                  }
                  to="/register"
                >
                  Start with Daymark <ArrowRight size={16} />
                </Link>
                <ul className={`grid gap-3 mt-[30px] md:mt-auto pt-7 border-t list-none p-0 ${plan.recommended ? 'border-[#f4f1e9]/20' : 'border-[#c7cfc2] dark:border-[#253931]'}`}>
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-center gap-2 text-[0.75rem] ${
                        plan.recommended
                          ? 'text-[#f4f1e9]/85 [&>svg]:shrink-0 [&>svg]:text-[#d5dfac]'
                          : 'text-[#647067] dark:text-[#abb6ae] [&>svg]:shrink-0 [&>svg]:text-[#b36d58] dark:[&>svg]:text-[#e08a70]'
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

        <section className="max-w-[1200px] mx-auto pt-0 pb-[90px] md:pb-[120px] px-5.5 md:px-[5vw]" aria-labelledby="comparison-title">
          <div className="mb-7.5 md:mb-10.5">
            <p className="mb-5 text-[#b36d58] dark:text-[#e08a70] text-[0.72rem] font-bold tracking-[0.08em] uppercase">At a glance</p>
            <h2 id="comparison-title" className="m-0 mb-4 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[clamp(2.7rem,5vw,4.6rem)] font-normal tracking-[-0.055em] leading-[1.02] [&>em]:font-normal [&>em]:text-[#6e8b72] dark:[&>em]:text-[#a7d0ab] [&>em]:not-italic">
              A simple comparison,<br /><em>without the small print.</em>
            </h2>
          </div>
          <div className="overflow-x-auto border-y border-[#aeb9ae] dark:border-[#253931] focus-visible:outline-2 focus-visible:outline-[#b36d58] focus-visible:outline-offset-4" tabIndex={0} aria-label="Scrollable plan comparison">
            <table className="w-full min-w-[740px] border-collapse text-[0.78rem]">
              <caption className="sr-only">Daymark plan feature comparison</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-[#f4f1e9] dark:bg-[#111a17] p-[19px_18px] border-b border-[#d4d9d0] dark:border-[#253931] text-left text-[#203b32] dark:text-[#f2f4ee] text-[0.72rem] font-bold">
                    What’s included
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      scope="col"
                      className={`p-[19px_18px] border-b border-[#d4d9d0] dark:border-[#253931] text-left text-[#203b32] dark:text-[#f2f4ee] text-[0.72rem] font-bold ${
                        plan.recommended ? 'bg-[#e5efc4]/40 dark:bg-[#254b38]/30 border-t-3 border-[#315844] dark:border-[#a7d0ab]' : ''
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
                  <tr key={row.label} className={rowIndex === COMPARISON_ROWS.length - 1 ? '[&>th]:border-b-0 [&>td]:border-b-0' : ''}>
                    <th scope="row" className="sticky left-0 z-10 bg-[#f4f1e9] dark:bg-[#111a17] p-[19px_18px] border-b border-[#d4d9d0] dark:border-[#253931] text-left text-[#4d5d51] dark:text-[#c5cec7] font-medium">
                      {row.label}
                    </th>
                    {row.values.map((value, index) => (
                      <td
                        className={`p-[19px_18px] border-b border-[#d4d9d0] dark:border-[#253931] text-left text-[#788279] dark:text-[#9eaba1] [&>svg]:text-[#6e8b72] dark:[&>svg]:text-[#a7d0ab] [&>svg]:inline-block [&>svg]:align-middle ${
                          index === 1 ? 'bg-[#e5efc4]/40 dark:bg-[#254b38]/30' : ''
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

        <section className="py-[92px] md:py-[120px] pb-[100px] md:pb-[132px] px-6 text-center bg-[#e5efc4] dark:bg-[#142820] dark:border-t dark:border-[#233e32]" aria-labelledby="pricing-closing-title">
          <p className="mb-5 text-[#b36d58] dark:text-[#e08a70] text-[0.72rem] font-bold tracking-[0.08em] uppercase">No pressure, just a beginning</p>
          <h2 id="pricing-closing-title" className="m-0 mb-7.5 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[clamp(3rem,6vw,5.6rem)] font-normal tracking-[-0.055em] leading-[1.02] [&>em]:font-normal [&>em]:text-[#6e8b72] dark:[&>em]:text-[#a7d0ab] [&>em]:not-italic">
            Start with today.<br /><em>Decide the rest later.</em>
          </h2>
          <div className="flex flex-col items-center gap-4">
            <Link
              className="inline-flex items-center gap-2.5 rounded-full text-[0.85rem] font-bold px-[21px] py-[15px] text-[#f4f1e9] bg-[#315844] hover:bg-[#3f6d51] dark:text-[#111a17] dark:bg-[#e5efc4] dark:hover:bg-[#f1f6d8] dark:border dark:border-[#e5efc4] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5"
              to="/register"
            >
              Start for free <ArrowRight size={17} />
            </Link>
            <Link className="inline-flex items-center gap-1.5 text-[#6e776e] dark:text-[#9eaba1] hover:text-[#b36d58] dark:hover:text-[#e08a70] text-[0.76rem] font-bold transition-colors" to="/login">
              Already have an account? Log in
            </Link>
          </div>
        </section>
      </main>

      <footer className="flex flex-col md:flex-row justify-between p-[23px_5vw_27px] text-[#eef1e8]/60 bg-[#203b32] dark:bg-[#0d1513] text-[0.68rem] gap-3 md:gap-0 [&>a]:text-[#d5dfac] [&>a]:font-bold hover:[&>a]:text-white transition-colors">
        <span>© 2026 Daymark. Made for real life.</span>
        <a href="mailto:hello@daymark.app">Ask a question</a>
      </footer>
    </div>
  )
}
