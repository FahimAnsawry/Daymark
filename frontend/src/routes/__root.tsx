import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from '../lib/theme'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <main>
        <Outlet />
      </main>
    </ThemeProvider>
  ),
})
