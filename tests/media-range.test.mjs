import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))

test('parses single byte ranges for saved media responses', async (t) => {
  const vite = await createServer({ root, logLevel: 'silent', server: { middlewareMode: true } })
  t.after(() => vite.close())
  const { parseSingleByteRange } = await vite.ssrLoadModule('/worker/media-range.ts')

  assert.deepEqual(parseSingleByteRange(null, 1000), { kind: 'none' })
  assert.deepEqual(parseSingleByteRange('bytes=0-99', 1000), { kind: 'range', offset: 0, length: 100, end: 99 })
  assert.deepEqual(parseSingleByteRange('bytes=900-', 1000), { kind: 'range', offset: 900, length: 100, end: 999 })
  assert.deepEqual(parseSingleByteRange('bytes=-25', 1000), { kind: 'range', offset: 975, length: 25, end: 999 })
  assert.deepEqual(parseSingleByteRange('bytes=950-1200', 1000), { kind: 'range', offset: 950, length: 50, end: 999 })
  assert.deepEqual(parseSingleByteRange('bytes=-2000', 1000), { kind: 'range', offset: 0, length: 1000, end: 999 })

  for (const invalid of ['bytes=1000-', 'bytes=20-10', 'bytes=-0', 'bytes=0-1,4-5', 'items=0-10']) {
    assert.deepEqual(parseSingleByteRange(invalid, 1000), { kind: 'invalid' })
  }
})
