import assert from 'node:assert/strict'
import test from 'node:test'

import { lyricAt, parseLrc, parseLyricPayload } from '../src/perfect-home/utils/music-lyrics.js'

test('parses LRC timestamps and finds the active lyric', () => {
  const lines = parseLrc('[00:01.20]第一句\n[00:03.005][00:05.50]重复句\n[ar:Elin]\n损坏行')
  assert.deepEqual(lines, [
    { timeMs: 1200, text: '第一句' },
    { timeMs: 3005, text: '重复句' },
    { timeMs: 5500, text: '重复句' },
  ])
  assert.equal(lyricAt(lines, 0.8), '')
  assert.equal(lyricAt(lines, 3.2), '重复句')
})

test('parses imported JSON lyrics and safely falls back to plain LRC', () => {
  const payload = parseLyricPayload(JSON.stringify({
    lrc: '[00:01.00]主歌词',
    translatedLrc: '[00:01.00]Translation',
    romanizedLrc: '[00:01.00]Romanized',
  }))
  assert.equal(payload.lines[0].text, '主歌词')
  assert.equal(payload.translatedLines[0].text, 'Translation')
  assert.equal(payload.romanizedLines[0].text, 'Romanized')
  assert.equal(parseLyricPayload('[00:02.00]普通歌词').lines[0].text, '普通歌词')
  assert.deepEqual(parseLyricPayload('{broken json').lines, [])
})
