const TIMESTAMP = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g

const fractionToMilliseconds = (value = '') => {
  if (!value) return 0
  if (value.length === 1) return Number(value) * 100
  if (value.length === 2) return Number(value) * 10
  return Number(value.slice(0, 3))
}

export function parseLrc(text) {
  if (typeof text !== 'string' || !text.trim()) return []
  const lines = []
  for (const rawLine of text.split(/\r?\n/).slice(0, 4_000)) {
    const timestamps = [...rawLine.matchAll(TIMESTAMP)]
    if (!timestamps.length) continue
    const lyric = rawLine.replace(TIMESTAMP, '').trim()
    if (!lyric) continue
    for (const match of timestamps) {
      const minutes = Number(match[1])
      const seconds = Number(match[2])
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) continue
      lines.push({
        timeMs: (minutes * 60 + seconds) * 1_000 + fractionToMilliseconds(match[3]),
        text: lyric.slice(0, 500),
      })
    }
  }
  return lines.sort((left, right) => left.timeMs - right.timeMs).slice(0, 4_000)
}

export function parseLyricPayload(raw) {
  if (typeof raw !== 'string') return { lines: [], translatedLines: [], romanizedLines: [] }
  let payload = { lrc: raw, translatedLrc: '', romanizedLrc: '' }
  if (raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        payload = {
          lrc: typeof parsed.lrc === 'string' ? parsed.lrc : '',
          translatedLrc: typeof parsed.translatedLrc === 'string' ? parsed.translatedLrc : '',
          romanizedLrc: typeof parsed.romanizedLrc === 'string' ? parsed.romanizedLrc : '',
        }
      }
    } catch {
      payload = { lrc: raw, translatedLrc: '', romanizedLrc: '' }
    }
  }
  return {
    lines: parseLrc(payload.lrc),
    translatedLines: parseLrc(payload.translatedLrc),
    romanizedLines: parseLrc(payload.romanizedLrc),
  }
}

export function lyricAt(lines, seconds) {
  if (!Array.isArray(lines) || !lines.length || !Number.isFinite(seconds)) return ''
  const timeMs = Math.max(0, seconds * 1_000)
  let low = 0
  let high = lines.length - 1
  let match = -1
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    if (lines[middle].timeMs <= timeMs) {
      match = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }
  return match >= 0 ? lines[match].text : ''
}
