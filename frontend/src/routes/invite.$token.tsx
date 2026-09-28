import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { BrandMark } from '../components/BrandMark'
import { LoadingPage } from '../components/LoadingPage'
import { useAuth } from '../lib/auth-context'
import { errorMessage } from '../lib/billing'
import { rememberPendingInvite, useAcceptInvitation, useInvitation } from '../lib/sharing'

export const Route = createFileRoute('/invite/$token')({
  component: InvitePage,
})

const mutedText = 'text-[#667085] dark:text-[#a7b0bf]'
const primaryButton =
  'inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-full border-0 btn-primary px-6 text-[0.92rem] font-bold no-underline disabled:cursor-default disabled:opacity-70'
const quietLink =
  'inline-flex min-h-[46px] items-center justify-center rounded-full border border-[#d9dee7] px-6 text-[0.92rem] font-semibold text-inherit no-underline hover:bg-black/[0.04] dark:border-[#383838] dark:hover:bg-white/[0.06]'

/**
 * Where a shared-project invitation email lands. Signed-out visitors are asked to sign in
 * first; the invitation is remembered and reopened after they reach the dashboard.
 */
function InvitePage() {
  const { token } = Route.useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const invitation = useInvitation(token, isAuthenticated)
  const accept = useAcceptInvitation(token)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) rememberPendingInvite(token)
  }, [isLoading, isAuthenticated, token])

  if (isLoading || (isAuthenticated && invitation.isPending)) return <LoadingPage />

  return (
    <div className="grid min-h-screen place-items-center bg-app-background px-5 py-16 text-[#1f2937] dark:text-[#f3f4f6]">
      <main className="w-full max-w-[480px] text-center">
        <BrandMark size="lg" className="mx-auto" />
        {!isAuthenticated ? (
          <>
            <h1 className="m-0 mt-6 font-display text-[1.9rem] font-semibold tracking-[-0.03em]">
              You&rsquo;ve been invited to a project
            </h1>
            <p className={`m-0 mt-3 ${mutedText}`}>
              Sign in or create a free account with the email the invitation was sent to.
              We&rsquo;ll bring you back here.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/login" className={primaryButton}>
                Sign in
              </Link>
              <Link to="/register" className={quietLink}>
                Create an account
              </Link>
            </div>
          </>
        ) : invitation.isError ? (
          <>
            <h1 className="m-0 mt-6 font-display text-[1.9rem] font-semibold tracking-[-0.03em]">
              This invitation isn&rsquo;t available
            </h1>
            <p className={`m-0 mt-3 ${mutedText}`}>
              It may have been cancelled. Ask the person who shared it to send a new one.
            </p>
            <Link to="/dashboard" className={`${quietLink} mt-8`}>
              Go to today&rsquo;s plan
            </Link>
          </>
        ) : (
          <>
            <h1 className="m-0 mt-6 font-display text-[1.9rem] font-semibold tracking-[-0.03em] text-balance">
              Join &ldquo;{invitation.data?.project}&rdquo;
            </h1>
            <p className={`m-0 mt-3 ${mutedText}`}>
              {invitation.data?.invited_by} would like to plan this project together with you.
            </p>
            {invitation.data?.is_for_you ? (
              <button
                type="button"
                className={`${primaryButton} mt-8`}
                disabled={accept.isPending}
                onClick={() =>
                  accept.mutate(undefined, {
                    onSuccess: (project) =>
                      void navigate({
                        to: '/dashboard',
                        search: { view: `project:${project.name}` },
                      }),
                  })
                }
              >
                {accept.isPending ? 'Joining…' : 'Join project'}
              </button>
            ) : (
              <p className="m-0 mt-8 rounded-xl bg-[#f7f6f2] px-4 py-3 text-sm dark:bg-[#262626]">
                This invitation was sent to <strong>{invitation.data?.email}</strong>. Sign in with
                that email to join.
              </p>
            )}
            {accept.isError && (
              <p role="alert" className="m-0 mt-3 text-sm text-red-700 dark:text-red-300">
                {errorMessage(accept.error, 'We couldn’t join the project. Please try again.')}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
