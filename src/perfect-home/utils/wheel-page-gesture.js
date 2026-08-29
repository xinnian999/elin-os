const DEFAULT_THRESHOLD = 18
const DEFAULT_COLLECTION_IDLE_MS = 180
const DEFAULT_NEW_GESTURE_IDLE_MS = 420
// MainRight animates for 620ms; the guard keeps the current page stable through the transition.
export const WHEEL_PAGE_TRANSITION_LOCK_MS = 680
const DEFAULT_MIN_DELTA = 1
const DEFAULT_CANDIDATE_GAP_MS = 80
const DEFAULT_DISCRETE_GESTURE_DELTA = 80

export function createWheelAxisLock({
  idleMs = DEFAULT_NEW_GESTURE_IDLE_MS,
  horizontalOnly = false,
  horizontalDominanceRatio = 1.25,
} = {}) {
  let axis = null
  let lastEventAt = null

  return {
    pick(deltaX, deltaY, now) {
      if (!Number.isFinite(now)) return 0
      const x = Number.isFinite(deltaX) ? deltaX : 0
      const y = Number.isFinite(deltaY) ? deltaY : 0

      if (lastEventAt === null || now - lastEventAt > idleMs) axis = null
      lastEventAt = now
      const isClearlyHorizontal = Math.abs(x) > Math.abs(y) * horizontalDominanceRatio
      if (!axis) {
        if (Math.abs(x) < 1 && Math.abs(y) < 1) return 0
        axis = horizontalOnly
          ? (isClearlyHorizontal ? 'x' : 'y')
          : (Math.abs(x) >= Math.abs(y) ? 'x' : 'y')
      }
      if (horizontalOnly && (axis !== 'x' || !isClearlyHorizontal)) return 0
      return axis === 'x' ? x : y
    },

    reset() {
      axis = null
      lastEventAt = null
    },
  }
}

export function createWheelPageGesture({
  threshold = DEFAULT_THRESHOLD,
  collectionIdleMs = DEFAULT_COLLECTION_IDLE_MS,
  newGestureIdleMs = DEFAULT_NEW_GESTURE_IDLE_MS,
  transitionLockMs = WHEEL_PAGE_TRANSITION_LOCK_MS,
  minDelta = DEFAULT_MIN_DELTA,
  candidateGapMs = DEFAULT_CANDIDATE_GAP_MS,
  discreteGestureDelta = DEFAULT_DISCRETE_GESTURE_DELTA,
} = {}) {
  let phase = 'collecting'
  let accumulatedDelta = 0
  let collectionPeak = 0
  let lastEventAt = null
  let lastMagnitude = 0
  let handledDirection = 0
  let lastMoveApplied = false
  let referencePeak = 0
  let tailLowSeen = false
  let lockedUntil = 0
  let candidate = null
  let queuedSample = null
  let emittedSample = null

  const clearCandidate = () => {
    candidate = null
  }

  const startCollecting = () => {
    phase = 'collecting'
    accumulatedDelta = 0
    collectionPeak = 0
    handledDirection = 0
    lastMoveApplied = false
    referencePeak = 0
    tailLowSeen = false
    lockedUntil = 0
    clearCandidate()
    queuedSample = null
    emittedSample = null
  }

  const emit = (sample) => {
    phase = 'awaiting-commit'
    emittedSample = sample
    return sample.direction
  }

  const emitQueued = (now) => {
    const sample = { ...queuedSample, at: now }
    queuedSample = null
    return emit(sample)
  }

  const confirmOrQueue = (sample, now) => {
    clearCandidate()
    if (now < lockedUntil) {
      queuedSample = sample
      return 0
    }
    return emit(sample)
  }

  const collectInitialGesture = (delta, now, magnitude) => {
    accumulatedDelta += delta
    collectionPeak = Math.max(collectionPeak, magnitude)
    if (Math.abs(accumulatedDelta) < threshold) return 0

    return emit({
      direction: accumulatedDelta > 0 ? 1 : -1,
      magnitude,
      peak: collectionPeak,
      at: now,
    })
  }

  const trackOppositeGesture = (direction, magnitude, now) => {
    if (magnitude < 6) {
      clearCandidate()
      return 0
    }

    if (magnitude >= discreteGestureDelta) {
      return confirmOrQueue({
        direction,
        magnitude,
        peak: magnitude,
        at: now,
      }, now)
    }

    if (
      candidate?.kind === 'opposite'
      && candidate.direction === direction
      && now - candidate.lastAt <= candidateGapMs
    ) {
      candidate.count += 1
      candidate.sum += magnitude
      candidate.lastMagnitude = magnitude
      candidate.lastAt = now
    } else {
      candidate = {
        kind: 'opposite',
        direction,
        count: 1,
        sum: magnitude,
        firstMagnitude: magnitude,
        lastMagnitude: magnitude,
        lastAt: now,
      }
    }

    if (candidate.count < 2 || candidate.sum < threshold) return 0
    return confirmOrQueue({
      direction,
      magnitude,
      peak: Math.max(candidate.firstMagnitude, magnitude),
      at: now,
    }, now)
  }

  const trackFreshGesture = (direction, magnitude, now) => {
    if (
      candidate?.kind === 'fresh'
      && candidate.direction === direction
      && now - candidate.lastAt <= candidateGapMs
    ) {
      candidate.count += 1
      candidate.sum += magnitude
      candidate.lastMagnitude = magnitude
      candidate.lastAt = now
    } else {
      candidate = {
        kind: 'fresh',
        direction,
        count: 1,
        sum: magnitude,
        firstMagnitude: magnitude,
        lastMagnitude: magnitude,
        lastAt: now,
      }
    }

    if (candidate.count === 1 && magnitude >= discreteGestureDelta) {
      return confirmOrQueue({
        direction,
        magnitude,
        peak: magnitude,
        at: now,
      }, now)
    }
    if (candidate.count < 2 || candidate.sum < threshold) return 0
    return confirmOrQueue({
      direction,
      magnitude,
      peak: Math.max(candidate.firstMagnitude, magnitude),
      at: now,
    }, now)
  }

  const trackSameDirectionGesture = (direction, magnitude, now) => {
    if (!lastMoveApplied) {
      clearCandidate()
      lastMagnitude = magnitude
      return 0
    }

    if (!tailLowSeen) {
      referencePeak = Math.max(referencePeak, magnitude)
      tailLowSeen = magnitude <= Math.max(4, referencePeak * 0.28)
    }

    const rise = magnitude - lastMagnitude
    const meaningfulRise = rise >= Math.max(2, lastMagnitude * 0.25)
    const continuingPeak = candidate?.kind === 'same'
      && candidate.direction === direction
      && now - candidate.lastAt <= candidateGapMs
      && candidate.firstMagnitude >= Math.max(14, referencePeak * 0.65)
      && magnitude >= Math.max(12, candidate.firstMagnitude * 0.65)
    if (tailLowSeen && meaningfulRise) {
      if (
        candidate?.kind === 'same'
        && candidate.direction === direction
        && now - candidate.lastAt <= candidateGapMs
      ) {
        candidate.count += 1
        candidate.sum += magnitude
        candidate.lastMagnitude = magnitude
        candidate.lastAt = now
      } else {
        candidate = {
          kind: 'same',
          direction,
          count: 1,
          sum: magnitude,
          firstMagnitude: magnitude,
          lastMagnitude: magnitude,
          lastAt: now,
        }
      }
    } else if (tailLowSeen && continuingPeak) {
      candidate.count += 1
      candidate.sum += magnitude
      candidate.lastMagnitude = magnitude
      candidate.lastAt = now
    } else {
      clearCandidate()
    }
    lastMagnitude = magnitude

    if (candidate?.kind !== 'same') return 0
    const growingWave = candidate.count >= 3
      && candidate.sum >= 24
      && candidate.lastMagnitude >= Math.max(14, referencePeak * 0.65)
      && candidate.lastMagnitude >= candidate.firstMagnitude * 1.8
    const peakFirstWave = candidate.count >= 2
      && candidate.sum >= 36
      && candidate.firstMagnitude >= Math.max(14, referencePeak * 0.65)
      && candidate.lastMagnitude >= Math.max(12, candidate.firstMagnitude * 0.65)
    if (!growingWave && !peakFirstWave) return 0

    return confirmOrQueue({
      direction,
      magnitude,
      peak: candidate.lastMagnitude,
      at: now,
    }, now)
  }

  return {
    push(delta, now) {
      if (!Number.isFinite(delta) || !Number.isFinite(now) || Math.abs(delta) < minDelta) return 0
      if (phase === 'awaiting-commit') return 0

      const magnitude = Math.abs(delta)
      const direction = Math.sign(delta)
      const eventGap = lastEventAt === null ? 0 : now - lastEventAt

      if (phase === 'consumed' && queuedSample) {
        lastEventAt = now
        return now >= lockedUntil ? emitQueued(now) : 0
      }

      if (phase === 'collecting' && eventGap > collectionIdleMs) {
        accumulatedDelta = 0
        collectionPeak = 0
      } else if (phase === 'consumed' && now >= lockedUntil && eventGap > newGestureIdleMs) {
        clearCandidate()
        lastEventAt = now
        return trackFreshGesture(direction, magnitude, now)
      }
      lastEventAt = now

      if (phase === 'collecting') return collectInitialGesture(delta, now, magnitude)
      if (candidate?.kind === 'fresh') return trackFreshGesture(direction, magnitude, now)
      if (direction !== handledDirection) return trackOppositeGesture(direction, magnitude, now)
      return trackSameDirectionGesture(direction, magnitude, now)
    },

    commit(applied, now = emittedSample?.at) {
      if (phase !== 'awaiting-commit' || !emittedSample || !Number.isFinite(now)) return

      const sample = emittedSample
      emittedSample = null
      phase = 'consumed'
      accumulatedDelta = 0
      collectionPeak = 0
      handledDirection = sample.direction
      lastMoveApplied = Boolean(applied)
      referencePeak = Math.max(sample.peak, sample.magnitude)
      tailLowSeen = false
      lastMagnitude = sample.magnitude
      lastEventAt = sample.at
      lockedUntil = applied ? now + transitionLockMs : now
      clearCandidate()
    },

    unlock(now) {
      if (phase !== 'consumed' || !Number.isFinite(now) || now < lockedUntil) return 0
      lockedUntil = 0
      if (!queuedSample) return 0
      return emitQueued(now)
    },

    reset() {
      startCollecting()
      lastEventAt = null
      lastMagnitude = 0
    },
  }
}
