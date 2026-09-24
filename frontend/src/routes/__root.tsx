import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from '../lib/theme'
import { AuthProvider } from '../lib/auth-context'
import { Toaster } from 'react-hot-toast'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <AuthProvider>
        <main className="min-h-screen bg-app-background text-[#1f2937] dark:text-[#f3f4f6] transition-colors duration-250">
          <Outlet />
        </main>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </ThemeProvider>
  ),
})
