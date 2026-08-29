import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createCountdownData,
  getNextLegalHoliday,
} from '../src/perfect-home/utils/holiday-countdown.js'

test('selects the next official 2026 holiday period', () => {
  const holiday = getNextLegalHoliday(new Date(2026, 7, 29, 12))

  assert.deepEqual(holiday, {
    name: '中秋节',
    date: '2026-09-25',
    endDate: '2026-09-27',
    official: true,
    active: false,
  })
})

test('keeps the current holiday visible while its official period is active', () => {
  const holiday = getNextLegalHoliday(new Date(2026, 8, 26, 12))

  assert.equal(holiday.name, '中秋节')
  assert.equal(holiday.active, true)
})

test('advances to the next official period after a holiday ends', () => {
  const holiday = getNextLegalHoliday(new Date(2026, 8, 28, 0))

  assert.equal(holiday.name, '国庆节')
  assert.equal(holiday.date, '2026-10-01')
})

test('falls back to statutory festival dates after the published schedule', () => {
  const newYear = getNextLegalHoliday(new Date(2026, 9, 8, 0))
  const springFestival = getNextLegalHoliday(new Date(2027, 0, 2, 0))

  assert.equal(newYear.date, '2027-01-01')
  assert.equal(springFestival.name, '春节')
  assert.equal(springFestival.date, '2027-02-06')
  assert.equal(springFestival.official, false)
})

test('counts down to the local start of a holiday', () => {
  const countdown = createCountdownData('2026-09-25', new Date('2026-09-24T23:59:58+08:00'))

  assert.deepEqual(countdown, {
    days: 0,
    hours: 0,
    mins: 0,
    secs: 2,
    reached: false,
    formatted: '2026年9月25日',
  })
})

test('can preserve the configured countdown end-of-day behavior', () => {
  const countdown = createCountdownData('2027-01-01', new Date('2027-01-01T23:59:58+08:00'), { endOfDay: true })

  assert.equal(countdown.secs, 1)
  assert.equal(countdown.reached, false)
})

test('selects holidays by China time regardless of timestamp notation', () => {
  const utc = getNextLegalHoliday(new Date('2026-09-24T16:30:00Z'))
  const china = getNextLegalHoliday(new Date('2026-09-25T00:30:00+08:00'))

  assert.equal(utc.name, '中秋节')
  assert.equal(utc.active, true)
  assert.deepEqual(utc, china)
})
