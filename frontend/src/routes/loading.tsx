import { createFileRoute } from '@tanstack/react-router'
import { LoadingPage } from '../components/LoadingPage'

export const Route = createFileRoute('/loading')({
  component: () => <LoadingPage />,
})
