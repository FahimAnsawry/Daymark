import { useEffect, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../lib/auth-context'
import { LoadingPage } from './LoadingPage'

interface GuestOnlyProps {
  children: ReactNode
}

/**
 * Route wrapper that prevents authenticated users from accessing guest/public marketing pages.
 * If authenticated, redirects to /dashboard.
 * While checking auth status or redirecting, renders LoadingPage.
 */
export function GuestOnly({ children }: GuestOnlyProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      void navigate({ to: '/dashboard', replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isAuthenticated || isLoading) {
    return <LoadingPage />
  }

  return <>{children}</>
}
