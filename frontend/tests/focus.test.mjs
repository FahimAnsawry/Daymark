import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  FOCUS_PRESETS,
  formatClock,
  formatFocusDuration,
  MAX_FOCUS_MINUTES,
  MIN_FOCUS_MINUTES,
} from '../src/lib/focus.ts'

test('includes expected focus presets (including 20 min, 30 min, 1h)', () => {
  assert.deepEqual([...FOCUS_PRESETS], [15, 20, 25, 30, 50, 60])
  assert.strictEqual(MIN_FOCUS_MINUTES, 5)
  assert.strictEqual(MAX_FOCUS_MINUTES, 180)
})

test('formats focus durations for presets and custom times', () => {
  assert.strictEqual(formatFocusDuration(15), '15 min')
  assert.strictEqual(formatFocusDuration(20), '20 min')
  assert.strictEqual(formatFocusDuration(25), '25 min')
  assert.strictEqual(formatFocusDuration(30), '30 min')
  assert.strictEqual(formatFocusDuration(50), '50 min')
  assert.strictEqual(formatFocusDuration(60), '1h')
  assert.strictEqual(formatFocusDuration(120), '2h')
  assert.strictEqual(formatFocusDuration(45), '45 min')
  assert.strictEqual(formatFocusDuration(5), '5 min')
})

test('formats countdown clock with minutes and seconds', () => {
  assert.strictEqual(formatClock(1500), '25:00')
  assert.strictEqual(formatClock(1200), '20:00')
  assert.strictEqual(formatClock(1800), '30:00')
  assert.strictEqual(formatClock(59), '00:59')
  assert.strictEqual(formatClock(0), '00:00')
})

test('formats countdown clock with hours when duration is 1 hour or more', () => {
  assert.strictEqual(formatClock(3600), '1:00:00')
  assert.strictEqual(formatClock(3665), '1:01:05')
  assert.strictEqual(formatClock(7200), '2:00:00')
})
