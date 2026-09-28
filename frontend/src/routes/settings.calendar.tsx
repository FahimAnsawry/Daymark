import { createFileRoute, redirect } from '@tanstack/react-router'

// Calendar moved into the dashboard sidebar; keep old links (and Google's result) working.
export const Route = createFileRoute('/settings/calendar')({
  beforeLoad: ({ search }) => {
    const { calendar } = search as { calendar?: unknown }
    throw redirect({
      to: '/dashboard',
      search: {
        view: 'calendar',
        ...((calendar === 'connected' || calendar === 'error') && { calendar }),
      },
      replace: true,
    })
  },
})
