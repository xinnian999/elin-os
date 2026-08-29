import assert from 'node:assert/strict'
import test from 'node:test'

import { createCalendarGrid } from '../src/perfect-home/utils/calendar-grid.js'

test('builds a Monday-first six-week calendar grid', () => {
  const cells = createCalendarGrid(new Date(2026, 7, 29))

  assert.equal(cells.length, 42)
  assert.equal(cells[0].dateKey, '2026-07-27')
  assert.equal(cells[41].dateKey, '2026-09-06')
  assert.deepEqual(
    cells.slice(0, 7).map(cell => cell.day),
    [27, 28, 29, 30, 31, 1, 2],
  )
})

test('marks today, adjacent-month cells, and weekends', () => {
  const cells = createCalendarGrid(new Date(2026, 7, 29))
  const today = cells.find(cell => cell.today)

  assert.equal(today.dateKey, '2026-08-29')
  assert.equal(today.currentMonth, true)
  assert.equal(today.weekend, true)
  assert.equal(cells[0].currentMonth, false)
  assert.equal(cells[5].weekend, true)
  assert.equal(cells[6].weekend, true)
})

test('handles a month that begins on Monday and year boundaries', () => {
  const february = createCalendarGrid(new Date(2027, 1, 6))
  const january = createCalendarGrid(new Date(2027, 0, 1))

  assert.equal(february[0].dateKey, '2027-02-01')
  assert.equal(february.filter(cell => cell.currentMonth).length, 28)
  assert.equal(january[0].dateKey, '2026-12-28')
  assert.equal(january[41].dateKey, '2027-02-07')
})

test('handles a Sunday month start and marks today exactly once', () => {
  const cells = createCalendarGrid(new Date(2026, 10, 1))

  assert.equal(cells[0].dateKey, '2026-10-26')
  assert.equal(cells[6].dateKey, '2026-11-01')
  assert.equal(cells.filter(cell => cell.today).length, 1)
})

test('handles leap years and returns an empty grid for invalid dates', () => {
  const leapFebruary = createCalendarGrid(new Date(2028, 1, 12))

  assert.equal(leapFebruary.filter(cell => cell.currentMonth).length, 29)
  assert.deepEqual(createCalendarGrid('not-a-date'), [])
})
