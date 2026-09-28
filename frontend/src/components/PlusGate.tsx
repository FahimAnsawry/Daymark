import { useState, type ReactNode } from 'react'
import { usePlan } from '../lib/auth-context'
import { errorMessage, useChangePlan } from '../lib/billing'
import { findPlan, TRIAL_DAYS, type PlanId } from '../lib/plans'
import { PlanLock } from './PlanLock'
import { UpgradeDialog } from './UpgradeDialog'

type Props = {
  plan: PlanId
  title: string
  description: string
  /** A settled, non-interactive glimpse of the feature, shown faded under the note. */
  preview?: ReactNode
}

const buttonClass =
  'mt-4 inline-flex min-h-[40px] cursor-pointer items-center rounded-full border-0 btn-primary px-5 text-[0.85rem] font-bold disabled:cursor-default disabled:opacity-70'

/** A calm note in place of a feature the user's plan doesn't include yet. */
export function PlusGate({ plan, title, description, preview }: Props) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const { plan: current } = usePlan()
  const changePlan = useChangePlan()
  const planName = findPlan(plan).name

  return (
    <section className="mt-8 overflow-hidden rounded-xl bg-[#f7f6f2] dark:bg-[#262626]">
      <div className="px-6 pt-6 pb-6">
        <h3 className="m-0 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-display text-[1.15rem] font-semibold tracking-[-0.02em]">
          {title}
          <PlanLock plan={plan} />
        </h3>
        <p className="m-0 mt-1.5 max-w-[52ch] text-sm leading-[1.55] text-[#5d6a62] dark:text-[#a7b0bf]">
          {description}
        </p>
        {current === 'free' ? (
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setUpgradeOpen(true)}
            className={buttonClass}
          >
            Try {planName} free for {TRIAL_DAYS} days
          </button>
        ) : (
          <button
            type="button"
            disabled={changePlan.isPending}
            onClick={() => changePlan.mutate(plan)}
            className={buttonClass}
          >
            {changePlan.isPending ? 'Switching…' : `Switch to ${planName}`}
          </button>
        )}
        {changePlan.isError && (
          <p role="alert" className="m-0 mt-2 text-sm text-red-700 dark:text-red-300">
            {errorMessage(changePlan.error, 'We couldn’t switch your plan. Please try again.')}
          </p>
        )}
      </div>
      {preview && (
        <div
          aria-hidden="true"
          inert
          className="pointer-events-none select-none px-6 pb-2 opacity-60 [mask-image:linear-gradient(to_bottom,#000_30%,transparent)] grayscale-[35%]"
        >
          {preview}
        </div>
      )}
      {upgradeOpen && <UpgradeDialog onClose={() => setUpgradeOpen(false)} />}
    </section>
  )
}

/** A white row for gate previews: the shape of the real thing, without its controls. */
export function PreviewRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-white px-4 text-sm text-[#1f2937] dark:bg-[#1f1f1f] dark:text-[#f2f2f2]">
      {children}
    </div>
  )
}

/** A static switch for gate previews. */
export function PreviewSwitch({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-block h-5 w-9 shrink-0 rounded-full ${on ? 'bg-[#c2410c] dark:bg-[#fed7aa]' : 'bg-[#d9dee7] dark:bg-[#484848]'}`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-white dark:bg-[#1f1f1f] ${on ? 'left-[18px]' : 'left-0.5'}`}
      />
    </span>
  )
}
