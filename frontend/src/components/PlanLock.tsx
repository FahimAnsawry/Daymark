import { Lock } from 'lucide-react'
import { findPlan, type PlanId } from '../lib/plans'

type Props = {
  plan: PlanId
  /** `badge` is a small pill with the plan name; `dot` is a lock tucked onto an icon button. */
  variant?: 'badge' | 'dot'
  className?: string
}

/**
 * The one mark for "this is part of a paid plan". Plus and Pro share the burnt-orange
 * primary pair so a lock reads as an invitation, not a warning.
 */
export function PlanLock({ plan, variant = 'badge', className = '' }: Props) {
  const name = findPlan(plan).name

  if (variant === 'dot') {
    return (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-0.5 -right-0.5 grid size-[15px] place-items-center rounded-full bg-[#fed7aa] text-[#9a3412] ring-2 ring-app-background dark:bg-[#fdba74] dark:text-[#1f2937] ${className}`}
      >
        <Lock size={9} strokeWidth={2.75} />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fed7aa] px-2 py-[3px] text-[11px] font-bold leading-none text-[#9a3412] dark:bg-[#fdba74]/20 dark:text-[#fed7aa] ${className}`}
    >
      <Lock size={10} strokeWidth={2.75} aria-hidden="true" />
      {name}
    </span>
  )
}
