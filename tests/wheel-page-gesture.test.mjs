import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createWheelAxisLock,
  createWheelPageGesture,
  WHEEL_PAGE_TRANSITION_LOCK_MS,
} from '../src/perfect-home/utils/wheel-page-gesture.js'

function pushAndCommit(gesture, delta, now, applied = true) {
  const direction = gesture.push(delta, now)
  if (direction) gesture.commit(applied, now)
  return direction
}

test('a diagonal gesture keeps its initial axis for the whole wheel stream', () => {
  const axisLock = createWheelAxisLock()
  const gesture = createWheelPageGesture()
  const events = [
    [0, 20, -5],
    [16, 7, -10],
    [32, 6, -10],
  ]

  const pageChanges = events
    .map(([now, deltaX, deltaY]) => pushAndCommit(gesture, axisLock.pick(deltaX, deltaY, now), now))
    .filter(Boolean)

  assert.deepEqual(pageChanges, [1])
  assert.equal(gesture.unlock(WHEEL_PAGE_TRANSITION_LOCK_MS), 0)
})

test('the axis lock preserves vertical-wheel fallback and resets after silence', () => {
  const axisLock = createWheelAxisLock()

  assert.equal(axisLock.pick(0, 100, 0), 100)
  assert.equal(axisLock.pick(20, 5, 16), 5)
  assert.equal(axisLock.pick(20, -5, 500), 20)
})

test('horizontal-only axis lock leaves a vertical wheel stream to native scrolling', () => {
  const axisLock = createWheelAxisLock({ horizontalOnly: true })

  assert.equal(axisLock.pick(2, 30, 0), 0)
  assert.equal(axisLock.pick(20, 5, 16), 0)
  assert.equal(axisLock.pick(20, 5, 500), 20)
})

test('horizontal-only axis lock rejects an ambiguous diagonal gesture', () => {
  const axisLock = createWheelAxisLock({ horizontalOnly: true })

  assert.equal(axisLock.pick(13, 12, 0), 0)
  assert.equal(axisLock.pick(24, 4, 16), 0)
})

test('horizontal-only axis lock releases vertical scrolling after a horizontal page gesture', () => {
  const axisLock = createWheelAxisLock({ horizontalOnly: true })

  assert.equal(axisLock.pick(20, 2, 0), 20)
  assert.equal(axisLock.pick(2, 30, 100), 0)
})

test('the reported inertial rebound can advance at most one page', () => {
  const gesture = createWheelPageGesture()
  const events = [
    [1_000, 8],
    [1_016, 12],
    [1_032, 30],
    [1_048, 20],
    [1_064, 12],
    [1_080, 7],
    [1_096, 4],
    [1_112, 3],
    [1_128, 8],
    [1_144, 12],
  ]

  const pageChanges = events
    .map(([now, delta]) => pushAndCommit(gesture, delta, now))
    .filter(Boolean)

  assert.deepEqual(pageChanges, [1])
})

test('sparse momentum after the transition lock is not treated as a new gesture', () => {
  const gesture = createWheelPageGesture()
  const events = [
    [0, 20],
    [100, 8],
    [200, 6],
    [300, 4],
    [500, 3],
    [700, 10],
    [750, 9],
  ]

  const pageChanges = events
    .map(([now, delta]) => pushAndCommit(gesture, delta, now))
    .filter(Boolean)

  assert.deepEqual(pageChanges, [1])
})

test('an independent gesture after a quiet gap can change page again', () => {
  const gesture = createWheelPageGesture()

  assert.equal(pushAndCommit(gesture, 20, 0), 1)
  assert.equal(pushAndCommit(gesture, 8, 300), 0)
  assert.equal(pushAndCommit(gesture, 10, 1_000), 0)
  assert.equal(pushAndCommit(gesture, 10, 1_016), 1)
})

test('a discrete wheel event after a quiet gap remains responsive', () => {
  const gesture = createWheelPageGesture()

  assert.equal(pushAndCommit(gesture, 100, 0), 1)
  assert.equal(pushAndCommit(gesture, 100, 1_000), 1)
})

test('small wheel deltas accumulate before changing page', () => {
  const gesture = createWheelPageGesture()

  assert.equal(pushAndCommit(gesture, 6, 0), 0)
  assert.equal(pushAndCommit(gesture, 7, 20), 0)
  assert.equal(pushAndCommit(gesture, 6, 40), 1)
})

test('a boundary no-op does not lock a confirmed reverse gesture', () => {
  const gesture = createWheelPageGesture()

  assert.equal(pushAndCommit(gesture, -20, 0, false), -1)
  assert.equal(pushAndCommit(gesture, 10, 16), 0)
  assert.equal(pushAndCommit(gesture, 11, 32), 1)
})

test('a same-direction new burst is queued until the current transition ends', () => {
  const gesture = createWheelPageGesture()

  assert.equal(pushAndCommit(gesture, 8, 0), 0)
  assert.equal(pushAndCommit(gesture, 12, 16), 1)
  for (const [now, delta] of [[32, 30], [80, 16], [128, 8], [176, 4], [192, 7], [208, 14], [224, 25]]) {
    assert.equal(pushAndCommit(gesture, delta, now), 0)
  }
  assert.equal(gesture.unlock(16 + WHEEL_PAGE_TRANSITION_LOCK_MS), 1)
})

test('a peak-first same-direction gesture is also queued', () => {
  const gesture = createWheelPageGesture()

  assert.equal(pushAndCommit(gesture, 20, 0), 1)
  for (const [now, delta] of [[32, 30], [80, 16], [128, 8], [176, 4], [220, 25], [236, 20]]) {
    assert.equal(pushAndCommit(gesture, delta, now), 0)
  }
  assert.equal(gesture.unlock(WHEEL_PAGE_TRANSITION_LOCK_MS), 1)
})

test('a discrete reverse wheel event works during a transition and at a boundary', () => {
  const gesture = createWheelPageGesture()

  assert.equal(pushAndCommit(gesture, 20, 0), 1)
  assert.equal(pushAndCommit(gesture, -100, 200), 0)
  assert.equal(gesture.unlock(WHEEL_PAGE_TRANSITION_LOCK_MS), -1)

  const boundaryGesture = createWheelPageGesture()
  assert.equal(pushAndCommit(boundaryGesture, -100, 0, false), -1)
  assert.equal(pushAndCommit(boundaryGesture, 100, 100), 1)
})

test('an overdue queued gesture wins over a later wheel sample', () => {
  const gesture = createWheelPageGesture()

  assert.equal(pushAndCommit(gesture, 20, 0), 1)
  assert.equal(pushAndCommit(gesture, -9, 176), 0)
  assert.equal(pushAndCommit(gesture, -11, 192), 0)
  assert.equal(gesture.push(100, 700), -1)
  gesture.commit(true, 700)
  assert.equal(gesture.unlock(1_380), 0)
})

test('a confirmed reverse burst is queued, but a single reverse spike is ignored', () => {
  const reverseGesture = createWheelPageGesture()
  assert.equal(pushAndCommit(reverseGesture, 20, 0), 1)
  assert.equal(pushAndCommit(reverseGesture, 30, 32), 0)
  assert.equal(pushAndCommit(reverseGesture, -9, 176), 0)
  assert.equal(pushAndCommit(reverseGesture, -11, 192), 0)
  assert.equal(reverseGesture.unlock(WHEEL_PAGE_TRANSITION_LOCK_MS), -1)

  const noisyGesture = createWheelPageGesture()
  assert.equal(pushAndCommit(noisyGesture, 20, 0), 1)
  assert.equal(pushAndCommit(noisyGesture, 30, 32), 0)
  assert.equal(pushAndCommit(noisyGesture, -24, 700), 0)
  assert.equal(pushAndCommit(noisyGesture, 3, 716), 0)
  assert.equal(noisyGesture.unlock(720), 0)
})

test('reduced-motion mode does not add a false animation lock', () => {
  const gesture = createWheelPageGesture({ transitionLockMs: 0 })

  assert.equal(pushAndCommit(gesture, -20, 0, false), -1)
  assert.equal(pushAndCommit(gesture, 9, 16), 0)
  assert.equal(pushAndCommit(gesture, 9, 32), 1)
  assert.equal(gesture.unlock(32), 0)
})

test('reset clears pending and consumed gesture state', () => {
  const gesture = createWheelPageGesture()

  assert.equal(pushAndCommit(gesture, -20, 0), -1)
  gesture.reset()
  assert.equal(pushAndCommit(gesture, 20, 10), 1)
})
