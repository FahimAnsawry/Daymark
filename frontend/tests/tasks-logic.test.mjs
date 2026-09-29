import assert from 'node:assert/strict'
import { test } from 'node:test'
import { completeTaskLocally, localDate } from '../src/lib/tasks.ts'

test('completing a daily task marks it done and records completed_at', () => {
  const task = {
    id: 1,
    title: 'Write report',
    done: false,
    due: '2026-09-28',
    project: 'Work',
    label: '',
  }

  const completed = completeTaskLocally(task)
  assert.equal(completed.done, true)
  assert.ok(completed.completed_at)

  // Uncompleting it
  const uncompleted = completeTaskLocally(completed)
  assert.equal(uncompleted.done, false)
  assert.equal(uncompleted.completed_at, null)
})

test('completing a recurring reminder task rolls forward and records completion for today', () => {
  const today = localDate(new Date())
  const task = {
    id: 2,
    title: 'Daily check-in',
    done: false,
    due: today,
    project: '',
    label: '',
    reminder: '09:00',
    reminder_frequency: 'daily',
  }

  const completed = completeTaskLocally(task)
  assert.equal(completed.done, false)
  assert.ok(completed.completed_at)
  assert.notEqual(completed.due, today)

  // Uncompleting it resets due to today and clears completed_at
  const uncompleted = completeTaskLocally(completed)
  assert.equal(uncompleted.done, false)
  assert.equal(uncompleted.completed_at, null)
  assert.equal(uncompleted.due, today)
})
