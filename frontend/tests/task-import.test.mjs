import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildImportPayload } from '../src/lib/task-import.ts'

test('maps localStorage tasks to the import payload', () => {
  const payload = buildImportPayload(
    [
      {
        id: 'abc',
        title: ' Ship it ',
        done: false,
        due: '2026-10-01',
        project: 'Work',
        label: 'urgent',
        time: '09:30',
        repeat: 'weekly',
      },
    ],
    ['Work', 'Home'],
  )

  assert.deepEqual(payload, {
    projects: ['Work', 'Home'],
    tasks: [
      {
        client_id: 'abc',
        title: 'Ship it',
        done: false,
        due: '2026-10-01',
        time: '09:30',
        project: 'Work',
        label: 'urgent',
        repeat: 'weekly',
      },
    ],
  })
})

test('fills defaults for fields older tasks did not have', () => {
  const [task] = buildImportPayload(
    [{ id: '1', title: 'Old', done: true, due: '', project: '', label: '' }],
    [],
  ).tasks
  assert.equal(task.time, '')
  assert.equal(task.repeat, 'none')
  assert.equal(task.done, true)
})

test('drops malformed tasks and blanks malformed fields', () => {
  const payload = buildImportPayload(
    [
      null,
      'nope',
      { id: '1', title: '' },
      { title: 'No id' },
      { id: '2', title: 'Keep', due: 'tomorrow', time: '25:00', repeat: 'hourly' },
      { id: '2', title: 'Duplicate id' },
    ],
    null,
  )

  assert.deepEqual(payload.projects, [])
  assert.equal(payload.tasks.length, 1)
  assert.equal(payload.tasks[0].title, 'Keep')
  assert.equal(payload.tasks[0].due, '')
  assert.equal(payload.tasks[0].time, '')
  assert.equal(payload.tasks[0].repeat, 'none')
})

test('handles missing storage values', () => {
  assert.deepEqual(buildImportPayload(undefined, undefined), { projects: [], tasks: [] })
})

test('removes blank and duplicate project names', () => {
  assert.deepEqual(buildImportPayload([], ['Work', ' ', 'Work', 3]).projects, ['Work'])
})
