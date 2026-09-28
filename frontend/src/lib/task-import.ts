export type ImportTask = {
  client_id: string
  title: string
  done: boolean
  due: string
  time: string
  project: string
  label: string
  repeat: 'none' | 'daily' | 'weekly' | 'monthly'
}

export type ImportPayload = { projects: string[]; tasks: ImportTask[] }

const REPEATS = ['none', 'daily', 'weekly', 'monthly'] as const
const text = (value: unknown, max = 255) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''
const matching = (value: unknown, pattern: RegExp) => {
  const trimmed = text(value)
  return pattern.test(trimmed) ? trimmed : ''
}

/**
 * Turns tasks and projects read from the old localStorage format into the API's import
 * payload. Anything malformed is dropped or blanked so one bad entry can't block the rest.
 */
export function buildImportPayload(localTasks: unknown, localProjects: unknown): ImportPayload {
  const tasks: ImportTask[] = []
  const seen = new Set<string>()

  for (const raw of Array.isArray(localTasks) ? localTasks : []) {
    if (!raw || typeof raw !== 'object') continue
    const task = raw as Record<string, unknown>
    const clientId = text(task.id, 64)
    const title = text(task.title)
    if (!clientId || !title || seen.has(clientId)) continue
    seen.add(clientId)

    const repeat = REPEATS.find((value) => value === task.repeat) ?? 'none'
    tasks.push({
      client_id: clientId,
      title,
      done: task.done === true,
      due: matching(task.due, /^\d{4}-\d{2}-\d{2}$/),
      time: matching(task.time, /^([01]\d|2[0-3]):[0-5]\d$/),
      project: text(task.project),
      label: text(task.label),
      repeat,
    })
  }

  const projects = [
    ...new Set(
      (Array.isArray(localProjects) ? localProjects : []).map((name) => text(name)).filter(Boolean),
    ),
  ]

  return { projects, tasks }
}

export const legacyStorageKeys = (userId: number) => ({
  tasks: `daymark.${userId}.tasks`,
  projects: `daymark.${userId}.projects`,
})
