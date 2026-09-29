import { ArrowLeft, Check, CreditCard, LoaderCircle, Wand2 } from 'lucide-react'
import { useEffect, useId, useRef, useState, type Ref } from 'react'
import { BrandMark } from './BrandMark'

/**
 * A simulated Stripe Checkout trial page. Billing in Daymark is simulated: nothing is
 * charged and no payment provider is involved. Only the card brand and last four digits
 * are sent to the API (via `onSubscribe`); the rest is discarded when the checkout closes.
 */

type CardBrand = 'visa' | 'mastercard' | 'amex' | null

/** What the confirmation page may show about the card: never the full number. */
export type CardSummary = { brand?: Exclude<CardBrand, null>; last4: string }

type Props = {
  containerRef: Ref<HTMLDivElement>
  titleId: string
  planName: string
  period: 'monthly' | 'yearly'
  amount: number
  trialDays: number
  chargeDate: Date
  defaultEmail: string
  onBack: () => void
  /** Records the plan; a rejection shows its message and lets the person try again. */
  onSubscribe: (card: CardSummary) => Promise<void>
  onComplete: (card: CardSummary) => void
}

const COUNTRIES = [
  { code: 'US', name: 'United States', postal: 'ZIP' },
  { code: 'GB', name: 'United Kingdom', postal: 'Postcode' },
  { code: 'CA', name: 'Canada', postal: 'Postal code' },
  { code: 'AU', name: 'Australia', postal: 'Postcode' },
  { code: 'BD', name: 'Bangladesh', postal: null },
  { code: 'DE', name: 'Germany', postal: null },
  { code: 'IN', name: 'India', postal: null },
] as const

const TEST_POSTAL: Partial<Record<(typeof COUNTRIES)[number]['code'], string>> = {
  US: '10001',
  GB: 'SW1A 1AA',
  CA: 'M5V 2T6',
  AU: '2000',
}

const money = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const longDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

const digitsOnly = (value: string) => value.replace(/\D/g, '')

const detectBrand = (digits: string): CardBrand => {
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  return null
}

const formatCardNumber = (digits: string, brand: CardBrand) => {
  const groups = brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4]
  const parts: string[] = []
  let rest = digits
  for (const size of groups) {
    if (!rest) break
    parts.push(rest.slice(0, size))
    rest = rest.slice(size)
  }
  return parts.join(' ')
}

const passesLuhn = (digits: string) => {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let n = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

type Errors = Partial<Record<'email' | 'card' | 'name' | 'postal', string>>

export function StripeCheckout({
  containerRef,
  titleId,
  planName,
  period,
  amount,
  trialDays,
  chargeDate,
  defaultEmail,
  onBack,
  onSubscribe,
  onComplete,
}: Props) {
  const [email, setEmail] = useState(defaultEmail)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]['code']>('US')
  const [postal, setPostal] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'processing' | 'succeeded'>('idle')
  const [submitError, setSubmitError] = useState<string>()
  const cardErrorId = useId()
  const mounted = useRef(true)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const cardDigits = digitsOnly(cardNumber)
  const brand = detectBrand(cardDigits)
  const cardLength = brand === 'amex' ? 15 : 16
  const cvcLength = brand === 'amex' ? 4 : 3
  const postalLabel = COUNTRIES.find((c) => c.code === country)?.postal ?? null
  const periodWord = period === 'yearly' ? 'year' : 'month'
  const fullPlanName = `Daymark ${planName}`

  const validateCard = () => {
    if (cardDigits.length < cardLength) return 'Your card number is incomplete.'
    if (!passesLuhn(cardDigits)) return 'Your card number is invalid.'
    const [mm, yy] = expiry.split(' / ')
    if (!mm || !yy || yy.length < 2) return 'Your card’s expiration date is incomplete.'
    const month = Number(mm)
    if (month < 1 || month > 12) return 'Your card’s expiration date is invalid.'
    const now = new Date()
    const expiresAt = new Date(2000 + Number(yy), month, 1)
    if (expiresAt <= new Date(now.getFullYear(), now.getMonth(), 1))
      return 'Your card’s expiration year is in the past.'
    if (cvc.length < cvcLength) return 'Your card’s security code is incomplete.'
    return undefined
  }

  const validate = (): Errors => ({
    email: /^\S+@\S+\.\S+$/.test(email) ? undefined : 'Your email is incomplete.',
    card: validateCard(),
    name: name.trim() ? undefined : 'Your name is required.',
    postal: postalLabel && !postal.trim() ? `Your ${postalLabel} is incomplete.` : undefined,
  })

  const submit = () => {
    const next = validate()
    setErrors(next)
    const firstInvalid = (['email', 'card', 'name', 'postal'] as const).find((k) => next[k])
    if (firstInvalid) {
      document.getElementById(`checkout-${firstInvalid}`)?.focus()
      return
    }
    setStatus('processing')
    setSubmitError(undefined)
    const card: CardSummary = { brand: brand ?? undefined, last4: cardDigits.slice(-4) }
    // Keep a short "processing" beat so the simulation feels like a real checkout.
    // Do not cancel these timers on unmount: starting a trial updates the plan, which
    // can replace gated screens (and this checkout) before the thank-you navigation runs.
    const minimumWait = new Promise((resolve) => window.setTimeout(resolve, 1400))
    Promise.all([onSubscribe(card), minimumWait])
      .then(() => {
        if (mounted.current) {
          setStatus('succeeded')
          window.setTimeout(() => onCompleteRef.current(card), 800)
        } else {
          onCompleteRef.current(card)
        }
      })
      .catch((error: unknown) => {
        if (!mounted.current) return
        setStatus('idle')
        setSubmitError(
          error instanceof Error && error.message
            ? error.message
            : 'We couldn’t start your trial. Please try again.',
        )
      })
  }

  const fillTestCard = () => {
    const nextYear = String((new Date().getFullYear() + 3) % 100).padStart(2, '0')
    if (!/^\S+@\S+\.\S+$/.test(email)) setEmail('test@example.com')
    setCardNumber('4242 4242 4242 4242')
    setExpiry(`12 / ${nextYear}`)
    setCvc('123')
    if (!name.trim()) setName('Test Customer')
    if (!postal.trim()) setPostal(TEST_POSTAL[country] ?? '')
    setErrors({})
  }

  const busy = status !== 'idle'

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
      }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-white text-[#1a1a1a] antialiased animate-dialog-fade-in selection:bg-[#c7d2fe] motion-reduce:animate-none"
    >
      <div className="grid min-h-full grid-cols-2 max-[900px]:grid-cols-1">
        {/* Order summary */}
        <section className="bg-[#1f2937] text-white">
          <div className="ml-auto flex w-full max-w-[440px] flex-col px-14 pb-12 pt-14 max-[900px]:mx-auto max-[900px]:max-w-[480px] max-[900px]:px-6 max-[900px]:pb-8 max-[900px]:pt-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-back
                className="group flex cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent p-1 -m-1 text-white/90 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default"
                aria-label="Back to plans"
                onClick={onBack}
                disabled={busy}
              >
                <ArrowLeft
                  size={17}
                  className="transition-transform duration-150 group-hover:-translate-x-0.5"
                />
                <BrandMark />
                <span className="font-logo text-[13px] font-bold uppercase tracking-[0.08em]">
                  Daymark
                </span>
              </button>
              <span className="rounded bg-[#ffde92] px-1.5 py-[1px] text-[11px] font-bold uppercase tracking-[0.03em] text-[#983705]">
                Test mode
              </span>
            </div>

            <div className="mt-10 max-[900px]:mt-6">
              <p className="m-0 text-[16px] font-medium text-white/65">Try {fullPlanName}</p>
              <h1
                id={titleId}
                className="m-0 mt-1 text-[36px] font-semibold leading-[1.15] tracking-[-0.01em]"
              >
                {trialDays} days free
              </h1>
              <p className="m-0 mt-1 text-[14px] text-white/65">
                Then {money(amount)} per {periodWord} starting {longDate(chargeDate)}
              </p>
            </div>

            <div className="mt-8 max-[900px]:hidden">
              <div className="flex items-start justify-between gap-4 text-[14px]">
                <div>
                  <p className="m-0 font-medium">{fullPlanName}</p>
                  <p className="m-0 mt-0.5 text-[12px] text-white/60">
                    Billed {period === 'yearly' ? 'yearly' : 'monthly'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="m-0 font-medium">{trialDays} days free</p>
                  <p className="m-0 mt-0.5 text-[12px] text-white/60">
                    {money(amount)} / {periodWord} after
                  </p>
                </div>
              </div>
              <dl className="m-0 mt-6 grid gap-3 border-t border-white/15 pt-5 text-[14px]">
                <div className="flex justify-between">
                  <dt className="text-white/80">Subtotal</dt>
                  <dd className="m-0 tabular-nums">{money(amount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/80">Total after trial</dt>
                  <dd className="m-0 tabular-nums">{money(amount)}</dd>
                </div>
                <div className="flex justify-between border-t border-white/15 pt-3 font-semibold">
                  <dt>Total due today</dt>
                  <dd className="m-0 tabular-nums">{money(0)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Payment form */}
        <section className="bg-white shadow-[-15px_0_30px_-18px_rgba(0,0,0,0.25)] max-[900px]:shadow-none">
          <form
            noValidate
            className="flex w-full max-w-[440px] flex-col px-14 pb-10 pt-14 max-[900px]:mx-auto max-[900px]:max-w-[480px] max-[900px]:px-6 max-[900px]:pt-7"
            onSubmit={(e) => {
              e.preventDefault()
              if (!busy) submit()
            }}
          >
            <FieldLabel htmlFor="checkout-email">Email</FieldLabel>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              disabled={busy}
              className={inputClass(Boolean(errors.email), 'rounded-md')}
            />
            <FieldError message={errors.email} />

            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="m-0 text-[16px] font-medium text-[#1a1a1a]">Payment method</p>
              <button
                type="button"
                onClick={fillTestCard}
                disabled={busy}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-[#e0a100] bg-[#fff8e6] px-2.5 py-1 text-[12px] font-semibold text-[#983705] transition-colors duration-150 hover:bg-[#ffefc2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c] disabled:cursor-default disabled:opacity-60"
              >
                <Wand2 size={13} aria-hidden="true" />
                Fill test card
              </button>
            </div>

            <FieldLabel htmlFor="checkout-card" className="mt-4">
              Card information
            </FieldLabel>
            <div className="relative">
              <input
                id="checkout-card"
                data-autofocus
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 1234 1234 1234"
                value={cardNumber}
                onChange={(e) => {
                  const digits = digitsOnly(e.target.value).slice(0, 19)
                  const nextBrand = detectBrand(digits)
                  setCardNumber(
                    formatCardNumber(digits.slice(0, nextBrand === 'amex' ? 15 : 16), nextBrand),
                  )
                }}
                aria-invalid={Boolean(errors.card)}
                aria-describedby={errors.card ? cardErrorId : undefined}
                disabled={busy}
                className={`${inputClass(Boolean(errors.card), 'rounded-t-md')} pr-[140px]`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 gap-1">
                {(brand ? [brand] : (['visa', 'mastercard', 'amex'] as const)).map((b) => (
                  <BrandBadge key={b} brand={b} />
                ))}
              </span>
            </div>
            <div className="grid grid-cols-2">
              <input
                aria-label="Expiration date"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM / YY"
                value={expiry}
                onChange={(e) => {
                  const digits = digitsOnly(e.target.value).slice(0, 4)
                  setExpiry(
                    digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits,
                  )
                }}
                aria-invalid={Boolean(errors.card)}
                disabled={busy}
                className={`${inputClass(Boolean(errors.card), 'rounded-bl-md')} -mt-px`}
              />
              <div className="relative -ml-px -mt-px">
                <input
                  aria-label="Security code"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="CVC"
                  value={cvc}
                  onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, cvcLength))}
                  aria-invalid={Boolean(errors.card)}
                  disabled={busy}
                  className={`${inputClass(Boolean(errors.card), 'rounded-br-md')} pr-11`}
                />
                <CreditCard
                  size={20}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d]"
                />
              </div>
            </div>
            <FieldError id={cardErrorId} message={errors.card} />
            {!errors.card && (
              <p className="m-0 mt-1.5 text-[12px] text-[#6d6e78]">
                Test mode: use 4242 4242 4242 4242, any future date and any CVC.
              </p>
            )}

            <FieldLabel htmlFor="checkout-name" className="mt-4">
              Cardholder name
            </FieldLabel>
            <input
              id="checkout-name"
              autoComplete="cc-name"
              placeholder="Full name on card"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              disabled={busy}
              className={inputClass(Boolean(errors.name), 'rounded-md')}
            />
            <FieldError message={errors.name} />

            <FieldLabel htmlFor="checkout-country" className="mt-4">
              Country or region
            </FieldLabel>
            <select
              id="checkout-country"
              autoComplete="country"
              value={country}
              onChange={(e) => setCountry(e.target.value as typeof country)}
              disabled={busy}
              className={`${inputClass(false, postalLabel ? 'rounded-t-md' : 'rounded-md')} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='12'%20height='12'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%236d6e78'%20stroke-width='2.5'%3E%3Cpath%20d='m6%209%206%206%206-6'/%3E%3C/svg%3E")] bg-[position:right_12px_center] bg-no-repeat`}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            {postalLabel && (
              <input
                id="checkout-postal"
                aria-label={postalLabel}
                autoComplete="postal-code"
                placeholder={postalLabel}
                value={postal}
                onChange={(e) => setPostal(e.target.value.slice(0, 10))}
                aria-invalid={Boolean(errors.postal)}
                disabled={busy}
                className={`${inputClass(Boolean(errors.postal), 'rounded-b-md')} -mt-px`}
              />
            )}
            <FieldError message={errors.postal} />
            <FieldError message={submitError} />

            <button
              type="submit"
              aria-live="polite"
              className={`relative mt-7 flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-md border-0 text-[16px] font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.08),0_2px_5px_rgba(0,0,0,0.12)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c] ${
                status === 'succeeded'
                  ? 'bg-[#15803d]'
                  : 'bg-[#c2410c] hover:bg-[#9a3412] disabled:hover:bg-[#c2410c]'
              }`}
              disabled={busy}
            >
              {status === 'idle' && 'Start trial'}
              {status === 'processing' && (
                <>
                  <LoaderCircle
                    size={20}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Processing</span>
                </>
              )}
              {status === 'succeeded' && (
                <>
                  <Check size={22} strokeWidth={3} aria-hidden="true" />
                  <span className="sr-only">Trial started</span>
                </>
              )}
            </button>

            <p className="m-0 mt-4 text-center text-[13px] leading-[1.5] text-[#6d6e78]">
              After your trial ends, you will be charged {money(amount)} per {periodWord} starting{' '}
              {longDate(chargeDate)}. You can always cancel before then.
            </p>

            <footer className="mt-10 flex items-center justify-center gap-3 text-[12px] text-[#8d8d8d] max-[900px]:mt-8">
              <span>
                Powered by{' '}
                <span className="font-bold tracking-[-0.02em] text-[#6d6e78]">stripe</span>
              </span>
              <span className="h-3.5 w-px bg-[#d9d9d9]" aria-hidden="true" />
              <span>Terms</span>
              <span>Privacy</span>
            </footer>
          </form>
        </section>
      </div>
    </div>
  )
}

const inputClass = (invalid: boolean, radius: string) =>
  `relative block h-[40px] w-full border px-3 text-[16px] leading-none text-[#1a1a1a] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#9a9a9a] focus:z-10 disabled:bg-[#fafafa] disabled:text-[#6d6e78] sm:text-[15px] ${radius} ${
    invalid
      ? 'z-[5] border-[#df1b41] text-[#df1b41] focus:shadow-[0_0_0_3px_rgba(223,27,65,0.2)]'
      : 'border-[#e0e0e0] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(0,0,0,0.02)] focus:border-[#c2410c] focus:shadow-[0_0_0_3px_rgba(194,65,12,0.18)]'
  }`

function FieldLabel({
  htmlFor,
  className = '',
  children,
}: {
  htmlFor: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1 block text-[13px] font-medium text-[#6d6e78] ${className}`}
    >
      {children}
    </label>
  )
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="m-0 mt-1.5 text-[13px] text-[#df1b41]">
      {message}
    </p>
  )
}

function BrandBadge({ brand }: { brand: Exclude<CardBrand, null> }) {
  if (brand === 'mastercard') {
    return (
      <svg width="28" height="18" viewBox="0 0 28 18" aria-label="Mastercard" role="img">
        <rect width="28" height="18" rx="3" fill="#1a1f36" />
        <circle cx="11.5" cy="9" r="5" fill="#eb001b" />
        <circle cx="16.5" cy="9" r="5" fill="#f79e1b" fillOpacity="0.9" />
      </svg>
    )
  }
  if (brand === 'amex') {
    return (
      <svg width="28" height="18" viewBox="0 0 28 18" aria-label="American Express" role="img">
        <rect width="28" height="18" rx="3" fill="#1f72cd" />
        <text
          x="14"
          y="12"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="800"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          AMEX
        </text>
      </svg>
    )
  }
  return (
    <svg width="28" height="18" viewBox="0 0 28 18" aria-label="Visa" role="img">
      <rect width="27" height="17" x="0.5" y="0.5" rx="2.5" fill="#fff" stroke="#e0e0e0" />
      <text
        x="14"
        y="12.2"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="800"
        fontStyle="italic"
        fill="#1a1f71"
        fontFamily="Arial, sans-serif"
      >
        VISA
      </text>
    </svg>
  )
}
