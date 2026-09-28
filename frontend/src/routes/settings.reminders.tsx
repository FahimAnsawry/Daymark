import { createFileRoute, redirect } from '@tanstack/react-router'

// Reminders moved into the dashboard sidebar; keep old links working.
export const Route = createFileRoute('/settings/reminders')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard', search: { view: 'reminders' }, replace: true })
  },
})
