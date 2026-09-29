import { createFileRoute, redirect } from '@tanstack/react-router'

// Profile now lives in Settings; keep old links working.
export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    throw redirect({ to: '/settings', replace: true })
  },
})
