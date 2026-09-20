import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Layers, Activity, CheckSquare, Sparkles } from 'lucide-react'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-500 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Laravel + React SPA
              </div>
              <div className="text-[11px] text-slate-400 font-mono -mt-0.5">
                TanStack Router • Query • Tailwind
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              activeProps={{
                className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
              }}
              inactiveProps={{
                className: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent',
              }}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Overview
            </Link>

            <Link
              to="/tasks"
              activeProps={{
                className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
              }}
              inactiveProps={{
                className: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent',
              }}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              TanStack Query Demo
            </Link>

            <Link
              to="/health"
              activeProps={{
                className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
              }}
              inactiveProps={{
                className: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent',
              }}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              API & DB Status
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Modern Fullstack Monorepo Architecture</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Laravel 11+ (API & Sanctum)</span>
            <span>•</span>
            <span>React 19 + TanStack</span>
            <span>•</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </footer>

      {/* Devtools (rendered in development) */}
      <TanStackRouterDevtools position="bottom-right" />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </div>
  )
}
