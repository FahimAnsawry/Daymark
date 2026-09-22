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
    <div className="pricing-page">
      <Navbar className="pricing-site-nav" />

      <main>
        <section className="plan-section" aria-labelledby="plans-title">
          <div className="pricing-section-heading">
            <p className="section-kicker">The shape of things to come</p>
            <h1 id="plans-title">Plans with room<br /><em>to breathe.</em></h1>

            <div className="pricing-toggle-container">
              <fieldset className="billing-toggle" aria-label="Billing period">
                <legend className="sr-only">Billing period</legend>
                <div
                  className="billing-toggle-pill"
                  style={{
                    transform: billingPeriod === 'monthly' ? 'translateX(0%)' : 'translateX(100%)',
                  }}
                  aria-hidden="true"
                />
                {(['monthly', 'yearly'] as const).map((period) => (
                  <label key={period} className={`billing-toggle-label ${billingPeriod === period ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="billing-period"
                      value={period}
                      checked={billingPeriod === period}
                      onChange={() => setBillingPeriod(period)}
                    />
                    <span>{period === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                  </label>
                ))}
              </fieldset>
              <p className="billing-note" aria-live="polite">Showing {billingPeriod} preview · no charges today</p>
            </div>
          </div>

          <div className="plan-grid">
            {PLANS.map((plan) => (
              <article className={`plan-card ${plan.recommended ? 'recommended' : ''}`} key={plan.name}>
                {plan.recommended && <span className="plan-badge">A considered fit</span>}
                <p className="plan-overline">Daymark plan</p>
                <h3>{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price" aria-label="Price coming soon">Coming soon</div>
                <p key={billingPeriod} className="plan-period">
                  {billingPeriod === 'monthly' ? 'Monthly preview' : 'Yearly preview'}
                </p>
                <Link className={plan.recommended ? 'plan-button plan-button-dark' : 'plan-button'} to="/register">
                  Start with Daymark <ArrowRight size={16} />
                </Link>
                <ul>
                  {plan.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="comparison-section" aria-labelledby="comparison-title">
          <div className="comparison-heading">
            <p className="section-kicker">At a glance</p>
            <h2 id="comparison-title">A simple comparison,<br /><em>without the small print.</em></h2>
          </div>
          <div className="comparison-scroll" tabIndex={0} aria-label="Scrollable plan comparison">
            <table>
              <caption className="sr-only">Daymark plan feature comparison</caption>
              <thead>
                <tr><th scope="col">What’s included</th>{PLANS.map((plan) => <th scope="col" className={plan.recommended ? 'recommended-column' : ''} key={plan.name}>{plan.name}</th>)}</tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td className={index === 1 ? 'recommended-column' : ''} key={`${row.label}-${index}`}>{value === 'Included' ? <><Check size={15} /> <span className="sr-only">Included</span></> : value}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pricing-closing" aria-labelledby="pricing-closing-title">
          <p className="section-kicker">No pressure, just a beginning</p>
          <h2 id="pricing-closing-title">Start with today.<br /><em>Decide the rest later.</em></h2>
          <div className="pricing-closing-actions">
            <Link className="primary-button dark-button" to="/register">Start for free <ArrowRight size={17} /></Link>
            <Link className="pricing-text-link" to="/login">Already have an account? Log in</Link>
          </div>
        </section>
      </main>

      <footer className="pricing-footer"><span>© 2026 Daymark. Made for real life.</span><a href="mailto:hello@daymark.app">Ask a question</a></footer>
    </div>
  )
}
