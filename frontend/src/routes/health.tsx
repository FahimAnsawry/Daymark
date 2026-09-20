import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Activity,
  CheckCircle,
  XCircle,
  Database,
  Server,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

export const Route = createFileRoute('/health')({
  component: HealthComponent,
})

interface HealthResponse {
  status: string
  framework: string
  php_version: string
  database: {
    connection: string
    host: string
    port: string
    database: string
    connected: boolean
    error: string | null
  }
  timestamp: string
}

function HealthComponent() {
  const {
    data: health,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get('/health')
      return res.data
    },
    retry: 1,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">API & Database Diagnostics</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time status of the Laravel API service and PostgreSQL connection.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Run Health Check
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">Laravel Backend Unreachable</h2>
              <p className="text-xs text-rose-300/80 mt-1">
                The frontend could not reach <code className="bg-rose-950/50 px-1 py-0.5 rounded font-mono">/api/health</code>.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-rose-900/30 text-xs font-mono text-slate-300">
            <p className="text-slate-400">// To start Laravel:</p>
            <p className="text-emerald-400 mt-1">cd backend</p>
            <p className="text-emerald-400">php artisan serve</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Backend Service Status */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <Server className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Laravel Service</h2>
                    <p className="text-xs text-slate-400 font-mono">{health?.framework}</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Online
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>PHP Engine:</span>
                  <span className="font-mono text-slate-200">{health?.php_version}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Timestamp:</span>
                  <span className="font-mono text-slate-200">{health?.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Database Status */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Database className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">PostgreSQL</h2>
                    <p className="text-xs text-slate-400 font-mono">
                      {health?.database.host}:{health?.database.port}
                    </p>
                  </div>
                </div>

                {health?.database.connected ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Connected
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Needs Config
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Database Name:</span>
                  <span className="font-mono text-slate-200">{health?.database.database}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Driver:</span>
                  <span className="font-mono text-slate-200">{health?.database.connection}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database guidance if not connected */}
          {!health?.database.connected && (
            <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-200 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                PostgreSQL Connection Instructions
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                PostgreSQL is configured in <code className="font-mono bg-amber-950/40 px-1.5 py-0.5 rounded text-amber-100">backend/.env</code>.
                Make sure your database credentials and database exist:
              </p>
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1">
                <p className="text-slate-500"># In backend/.env:</p>
                <p>DB_CONNECTION=pgsql</p>
                <p>DB_HOST=127.0.0.1</p>
                <p>DB_PORT=5432</p>
                <p>DB_DATABASE=laravel_react</p>
                <p>DB_USERNAME=postgres</p>
                <p className="text-amber-400">DB_PASSWORD=your_postgresql_password</p>
                <p className="text-slate-500 pt-2"># Then run migration in backend folder:</p>
                <p className="text-emerald-400">php artisan migrate</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
