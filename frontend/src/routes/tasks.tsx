import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/api'
import {
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  RefreshCw,
  Cpu,
  AlertCircle,
  Tag,
  Loader2,
} from 'lucide-react'

export const Route = createFileRoute('/tasks')({
  component: TasksComponent,
})

interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
  tag?: string
  created_at: string
}

function TasksComponent() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tag, setTag] = useState('Frontend')

  // Fetch Tasks with TanStack Query
  const {
    data: tasks = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks')
      return res.data.data
    },
  })

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: { title: string; description: string; tag: string }) => {
      const res = await api.post('/tasks', newTask)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setTitle('')
      setDescription('')
    },
  })

  // Toggle Task Mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/tasks/${id}/toggle`)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Delete Task Mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tasks/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    createTaskMutation.mutate({ title, description, tag })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">TanStack Query Demo</h1>
            {isFetching && !isLoading && (
              <span className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                <Loader2 className="w-3 h-3 animate-spin" />
                Background Syncing
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time querying and mutations interacting directly with the Laravel API.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refetch Cache
        </button>
      </div>

      {/* Add Task Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
      >
        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-400" />
          Add New Task (Demonstrates useMutation)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              required
            />
          </div>

          <div>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Frontend">Frontend (React/TanStack)</option>
              <option value="Backend">Backend (Laravel API)</option>
              <option value="Database">Database (PostgreSQL)</option>
              <option value="DevOps">DevOps & Config</option>
            </select>
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="Optional details / description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createTaskMutation.isPending || !title.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {createTaskMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding Task...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Task
              </>
            )}
          </button>
        </div>
      </form>

      {/* Task List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Items in State ({tasks.length})
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 text-rose-400 shrink-0" />
            <div>
              <div className="font-semibold text-sm">Failed to connect to Laravel backend</div>
              <div className="text-xs text-rose-300/80 mt-1">
                Make sure the Laravel server is running at{' '}
                <code className="bg-rose-950/50 px-1 py-0.5 rounded font-mono">http://127.0.0.1:8000</code>.
                You can run <code className="bg-rose-950/50 px-1 py-0.5 rounded font-mono">php artisan serve</code> inside the backend directory.
              </div>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-slate-500 text-sm">
            No tasks found. Create one above to test TanStack Query mutations!
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-start justify-between p-4 rounded-xl border transition-all duration-200 ${
                  task.completed
                    ? 'bg-slate-950/40 border-slate-850 opacity-60'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleTaskMutation.mutate(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          task.completed
                            ? 'line-through text-slate-500'
                            : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.tag && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                          <Tag className="w-2.5 h-2.5" />
                          {task.tag}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                    )}

                    <span className="text-[10px] text-slate-600 font-mono mt-1 block">
                      Added: {task.created_at}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
