import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deleteEmptyProject } from '../src/lib/projects.ts'

test('deletes a project without tasks', () => {
  const projects = ['Personal', 'Work']
  const tasks = [{ project: 'Work' }]
  assert.deepEqual(deleteEmptyProject(projects, tasks, 'Personal'), ['Work'])
})

test('keeps a project with active or completed tasks', () => {
  const projects = ['Personal', 'Work']
  for (const done of [false, true]) {
    const tasks = [{ project: 'Personal', done }]
    assert.strictEqual(deleteEmptyProject(projects, tasks, 'Personal'), projects)
  }
})

test('does not change the list for a project that does not exist', () => {
  const projects = ['Personal']
  assert.strictEqual(deleteEmptyProject(projects, [], 'Missing'), projects)
})
