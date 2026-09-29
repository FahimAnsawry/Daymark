import { createFileRoute } from '@tanstack/react-router'
import { ResetPasswordPage } from '../components/ResetPasswordPage'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: ResetPassword,
})

function ResetPassword() {
  const { token, email } = Route.useSearch()
  return <ResetPasswordPage token={token} email={email} />
}
