import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useAuth, usePlan } from '../lib/auth-context'
import { errorMessage } from '../lib/billing'
import {
  useCancelInvitation,
  useInviteToProject,
  useProjectMembers,
  useRemoveMember,
} from '../lib/sharing'
import type { ProjectRow } from '../lib/tasks'
import { PlanLock } from './PlanLock'
import { UpgradeDialog } from './UpgradeDialog'

type Props = {
  project: ProjectRow
  onClose: () => void
  /** Called after the signed-in member leaves, so the dashboard can move away. */
  onLeft: () => void
}

const mutedText = 'text-[#667085] dark:text-[#a7b0bf]'
const rowClass =
  'flex min-h-12 items-center justify-between gap-3 border-b border-[#e7eaef] py-2 last:border-b-0 dark:border-[#383838]'
const quietButton =
  'cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-[13px] font-medium text-[#667085] hover:bg-black/[0.05] hover:text-red-700 disabled:opacity-60 dark:text-[#a7b0bf] dark:hover:bg-white/[0.06] dark:hover:text-red-300'

/**
 * Who has access to a project. The owner invites people by email (a Pro feature) and can
 * remove them; members can see everyone and leave.
 */
export function ShareProjectDialog({ project, onClose, onLeft }: Props) {
  const { user } = useAuth()
  const { has } = usePlan()
  const members = useProjectMembers(project.id)
  const invite = useInviteToProject(project.id)
  const cancelInvitation = useCancelInvitation(project.id)
  const removeMember = useRemoveMember(project.id)
  const [email, setEmail] = useState('')
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const isOwner = project.is_owner !== false
  const canInvite = isOwner && has('pro')

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !upgradeOpen) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [onClose, upgradeOpen])

  const failure = invite.error ?? cancelInvitation.error ?? removeMember.error

  return (
    <div
      className="fixed inset-0 z-[55] grid place-items-center bg-[#111827]/45 p-5 max-[560px]:items-end max-[560px]:p-0"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[560px] rounded-2xl bg-white p-6 text-[#1f2937] shadow-[0_28px_80px_rgba(17,24,39,0.28)] dark:bg-[#262626] dark:text-[#f3f4f6] max-[560px]:rounded-b-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={titleId}
              className="m-0 font-display text-[1.35rem] font-semibold tracking-[-0.02em]"
            >
              Share {project.name}
            </h2>
            <p className={`m-0 mt-1 text-sm ${mutedText}`}>
              {isOwner
                ? 'People you invite can see, add, finish and assign tasks here.'
                : `${project.owner_name ?? 'Someone'} shared this project with you.`}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            data-autofocus={!canInvite || undefined}
            className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent hover:bg-black/[0.06] dark:hover:bg-white/[0.08] ${mutedText}`}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {isOwner &&
          (canInvite ? (
            <form
              className="mt-5 flex gap-2 max-[420px]:flex-col"
              onSubmit={(event) => {
                event.preventDefault()
                if (!email.trim()) return
                invite.mutate(email.trim(), { onSuccess: () => setEmail('') })
              }}
            >
              <label className="sr-only" htmlFor={`${titleId}-email`}>
                Email address
              </label>
              <input
                id={`${titleId}-email`}
                data-autofocus
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#d9dee7] bg-transparent px-3 text-[15px] text-inherit outline-none focus:border-orange-500 dark:border-[#484848]"
              />
              <button
                type="submit"
                disabled={invite.isPending}
                className="min-h-11 cursor-pointer rounded-full border-0 btn-primary px-5 text-[0.88rem] font-bold disabled:opacity-70"
              >
                {invite.isPending ? 'Inviting…' : 'Invite'}
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded-xl bg-[#f7f6f2] px-4 py-3.5 dark:bg-[#1f1f1f]">
              <p className="m-0 flex items-center gap-2 text-sm font-semibold">
                Invite people to this project <PlanLock plan="pro" />
              </p>
              <p className={`m-0 mt-1 text-sm ${mutedText}`}>
                Share a project with a partner, family or small team. People you invite can be on
                any plan.
              </p>
              <button
                type="button"
                aria-haspopup="dialog"
                data-autofocus
                onClick={() => setUpgradeOpen(true)}
                className="mt-3 min-h-9 cursor-pointer rounded-full border-0 btn-primary px-4 text-[0.82rem] font-bold"
              >
                See Pro
              </button>
            </div>
          ))}

        {failure && (
          <p role="alert" className="m-0 mt-3 text-sm text-red-700 dark:text-red-300">
            {errorMessage(failure, 'Something went wrong. Please try again.')}
          </p>
        )}

        <h3 className="m-0 mt-6 text-sm font-semibold">People with access</h3>
        {members.isPending ? (
          <p className={`mt-3 text-sm ${mutedText}`} role="status">
            Loading…
          </p>
        ) : members.isError ? (
          <p className="mt-3 text-sm">We couldn&rsquo;t load who has access.</p>
        ) : (
          <ul className="m-0 mt-2 list-none p-0">
            <li className={rowClass}>
              <Person
                name={members.data.owner.name}
                email={members.data.owner.email}
                you={members.data.owner.id === user?.id}
              />
              <span className={`text-[13px] ${mutedText}`}>Owner</span>
            </li>
            {members.data.members.map((member) => (
              <li key={member.id} className={rowClass}>
                <Person name={member.name} email={member.email} you={member.id === user?.id} />
                {isOwner ? (
                  <button
                    type="button"
                    className={quietButton}
                    disabled={removeMember.isPending}
                    onClick={() => removeMember.mutate(member.id)}
                  >
                    Remove
                  </button>
                ) : member.id === user?.id ? (
                  <button
                    type="button"
                    className={quietButton}
                    disabled={removeMember.isPending}
                    onClick={() => removeMember.mutate(member.id, { onSuccess: onLeft })}
                  >
                    Leave
                  </button>
                ) : (
                  <span className={`text-[13px] ${mutedText}`}>Can edit</span>
                )}
              </li>
            ))}
            {members.data.invitations.map((invitation) => (
              <li key={invitation.id} className={rowClass}>
                <Person name={invitation.email} />
                <span className="flex items-center gap-2">
                  <span className={`text-[13px] ${mutedText}`}>Invite sent</span>
                  {isOwner && (
                    <button
                      type="button"
                      className={quietButton}
                      aria-label={`Cancel invitation to ${invitation.email}`}
                      disabled={cancelInvitation.isPending}
                      onClick={() => cancelInvitation.mutate(invitation.id)}
                    >
                      Cancel
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {upgradeOpen && <UpgradeDialog onClose={() => setUpgradeOpen(false)} />}
    </div>
  )
}

function Person({ name, email, you = false }: { name: string; email?: string; you?: boolean }) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-sm font-medium">
        {name}
        {you && <span className={`font-normal ${mutedText}`}> (you)</span>}
      </span>
      {email && <span className={`block truncate text-[12px] ${mutedText}`}>{email}</span>}
    </span>
  )
}
