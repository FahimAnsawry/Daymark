import { ChevronRight, Folder, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { usePlan } from '../lib/auth-context'
import { lockedSuffix } from '../lib/plans'
import type { ProjectRow } from '../lib/tasks'
import { PlanLock } from './PlanLock'
import { PlusGate, PreviewRow } from './PlusGate'

type Props = {
  projects: ProjectRow[]
  onOpen: (name: string) => void
  onShare: (project: ProjectRow) => void
}

const mutedText = 'text-[#667085] dark:text-[#a7b0bf]'
const rule = 'border-[#e7eaef] dark:border-[#383838]'
const shareButton =
  'inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#d9dee7] bg-transparent px-4 text-[13px] font-semibold text-inherit hover:bg-orange-500/10 hover:text-[#c2410c] dark:border-[#484848] dark:hover:text-[#fdba74]'

const people = (count: number) => `${count} ${count === 1 ? 'person' : 'people'}`

/**
 * Shared projects (Pro): what you share, what's shared with you, and what you could share.
 * Projects shared with someone stay open to them on any plan; only inviting needs Pro.
 */
export function SharedProjectsView({ projects, onOpen, onShare }: Props) {
  const { has } = usePlan()
  const isPro = has('pro')
  const withYou = projects.filter((project) => project.is_owner === false)
  const owned = projects.filter((project) => project.is_owner !== false && project.id > 0)
  const byYou = owned.filter((project) => (project.members_count ?? 0) > 0)
  const notShared = owned.filter((project) => (project.members_count ?? 0) === 0)

  return (
    <div className="max-w-[640px]">
      <p className={`m-0 text-[15px] leading-[1.6] ${mutedText}`}>
        Plan a project together with a partner, family or small team, and assign tasks to each
        other.
      </p>

      {isPro ? (
        <>
          <Section title="Shared by you">
            {byYou.length === 0 ? (
              <Empty>You haven&rsquo;t shared a project yet.</Empty>
            ) : (
              byYou.map((project) => (
                <Row
                  key={project.id}
                  project={project}
                  detail={`You and ${people(project.members_count ?? 0)}`}
                  shared
                  onOpen={onOpen}
                  action={
                    <button type="button" className={shareButton} onClick={() => onShare(project)}>
                      Manage
                    </button>
                  }
                />
              ))
            )}
          </Section>
          {notShared.length > 0 && (
            <Section title="Ready to share">
              {notShared.map((project) => (
                <Row
                  key={project.id}
                  project={project}
                  detail="Only you"
                  onOpen={onOpen}
                  action={
                    <button
                      type="button"
                      className={shareButton}
                      aria-label={`Share ${project.name}`}
                      onClick={() => onShare(project)}
                    >
                      <UsersRound size={15} aria-hidden="true" /> Share
                    </button>
                  }
                />
              ))}
            </Section>
          )}
        </>
      ) : (
        <PlusGate
          plan="pro"
          title="Plan together, not alone"
          description="Invite someone by email, choose what they can do, and assign tasks to each other. Only the owner needs Pro; the people you invite can be on any plan."
          preview={
            <div className="grid gap-2">
              <PreviewRow>
                You <span className={mutedText}>Owner</span>
              </PreviewRow>
              <PreviewRow>
                Sam <span className={mutedText}>Can edit</span>
              </PreviewRow>
              <PreviewRow>
                alex@example.com <span className={mutedText}>Invite sent</span>
              </PreviewRow>
            </div>
          }
        />
      )}

      <Section title="Shared with you">
        {withYou.length === 0 ? (
          <Empty>When someone invites you to a project, it shows up here.</Empty>
        ) : (
          withYou.map((project) => (
            <Row
              key={project.id}
              project={project}
              detail={project.owner_name ? `Shared by ${project.owner_name}` : 'Shared with you'}
              shared
              onOpen={onOpen}
              action={
                <button type="button" className={shareButton} onClick={() => onShare(project)}>
                  People
                </button>
              }
            />
          ))
        )}
      </Section>

      {!isPro && owned.length > 0 && (
        <Section title="Your projects">
          {owned.map((project) => (
            <Row
              key={project.id}
              project={project}
              detail="Only you"
              onOpen={onOpen}
              action={
                <button
                  type="button"
                  className={shareButton}
                  aria-haspopup="dialog"
                  aria-label={`Share ${project.name}${lockedSuffix('pro')}`}
                  onClick={() => onShare(project)}
                >
                  Share <PlanLock plan="pro" />
                </button>
              }
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="m-0 text-sm font-semibold">{title}</h2>
      <ul className="m-0 mt-2 list-none p-0">{children}</ul>
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <li className={`py-2 text-sm ${mutedText}`}>{children}</li>
}

function Row({
  project,
  detail,
  shared = false,
  action,
  onOpen,
}: {
  project: ProjectRow
  detail: string
  shared?: boolean
  action: ReactNode
  onOpen: (name: string) => void
}) {
  const Icon = shared ? UsersRound : Folder
  return (
    <li className={`flex min-h-[58px] items-center justify-between gap-3 border-b py-2 ${rule}`}>
      <button
        type="button"
        onClick={() => onOpen(project.name)}
        className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent p-0 text-left text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        <Icon size={18} strokeWidth={1.7} aria-hidden="true" className={`shrink-0 ${mutedText}`} />
        <span className="min-w-0">
          <span className="block truncate text-[15px] group-hover:underline group-hover:underline-offset-4">
            {project.name}
          </span>
          <span className={`block text-[12px] ${mutedText}`}>
            {detail}
            {project.tasks_count !== undefined &&
              ` · ${project.tasks_count} ${project.tasks_count === 1 ? 'task' : 'tasks'}`}
          </span>
        </span>
        <ChevronRight
          size={16}
          aria-hidden="true"
          className={`ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${mutedText}`}
        />
      </button>
      {action}
    </li>
  )
}
