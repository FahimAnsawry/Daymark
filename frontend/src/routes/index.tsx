import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Layers,
  Database,
  Route as RouteIcon,
  Cpu,
  Server,
  Palette,
  ShieldCheck,
  ArrowRight,
  Terminal,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const stack = [
    {
      name: 'Laravel API',
      category: 'Backend',
      description: 'RESTful API with Laravel Sanctum authentication, clean routing, and JSON exception handling.',
      icon: Server,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      badge: 'v11 / v12',
    },
    {
      name: 'React 19 + TypeScript',
      category: 'Frontend',
      description: 'Modern component-driven UI with strict typing and lightning-fast Vite bundling.',
      icon: Layers,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      badge: 'React 19',
    },
    {
      name: 'TanStack Router',
      category: 'Routing',
      description: 'Fully type-safe client-side routing with auto code-splitting and search param state.',
      icon: RouteIcon,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      badge: 'v1.x',
    },
    {
      name: 'TanStack Query',
      category: 'State Management',
      description: 'Asynchronous server-state management with automatic caching, retries, and optimistic updates.',
      icon: Cpu,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      badge: 'v5.x',
    },
    {
      name: 'Tailwind CSS v4',
      category: 'Styling',
      description: 'Next-generation high-performance utility-first styling with native CSS cascade layers.',
      icon: Palette,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      badge: 'v4.x',
    },
    {
      name: 'PostgreSQL Database',
      category: 'Persistence',
      description: 'Robust relational database configured via pgsql driver with migration & seeder support.',
      icon: Database,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      badge: 'pgsql',
    },
  ]

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/50 to-slate-950 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Fullstack Architecture Initialized
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Laravel API <span className="text-slate-500">+</span> React SPA
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Your project is structured with a decoupled <span className="text-slate-200 font-semibold">backend/</span> (Laravel API with Sanctum) and <span className="text-slate-200 font-semibold">frontend/</span> (Vite + React + TanStack Router + TanStack Query + Tailwind CSS v4).
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
            >
              Test TanStack Query Demo
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/health"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition-all active:scale-95"
            >
              Verify Database & API
            </Link>
          </div>
        </div>
      </div>

      {/* Tech Stack Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Active Technology Stack</h2>
            <p className="text-sm text-slate-400">Everything requested is pre-configured and connected</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stack.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-slate-700 hover:bg-slate-900/70 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.border} border flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                      {item.badge}
                    </span>
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Start Commands */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-4 text-white font-semibold text-base">
          <Terminal className="w-5 h-5 text-indigo-400" />
          Quick Development Commands
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-slate-500 text-[11px] uppercase tracking-wider font-sans font-semibold">
              Backend (Laravel Server)
            </div>
            <p className="text-emerald-400 font-semibold">cd backend</p>
            <p className="text-slate-300">php artisan serve</p>
            <div className="text-slate-500 text-[11px] pt-1">
              Runs on: <span className="text-indigo-400">http://127.0.0.1:8000</span>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-slate-500 text-[11px] uppercase tracking-wider font-sans font-semibold">
              Frontend (Vite Dev Server)
            </div>
            <p className="text-emerald-400 font-semibold">cd frontend</p>
            <p className="text-slate-300">npm run dev</p>
            <div className="text-slate-500 text-[11px] pt-1">
              Runs on: <span className="text-indigo-400">http://localhost:5173</span> (with /api proxy)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
