import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const baseHome = {
  site: {
    avatar: 'E',
    startDate: '2026-08-20',
    typewriterLines: ['保持好奇'],
    countdownName: '倒计时',
    countdownDate: '2027-01-01',
  },
  announcement: {
    enabled: true,
    text: '公告',
    speed: 48,
    backgroundColor: '#000',
    textColor: '#fff',
  },
}

test('normalizes and maps the R2-backed music playlist', async (t) => {
  const vite = await createServer({ root, logLevel: 'silent', server: { middlewareMode: true } })
  t.after(() => vite.close())
  const [{ normalizeHome }, { makeConfig }] = await Promise.all([
    vite.ssrLoadModule('/worker/schema.ts'),
    vite.ssrLoadModule('/src/perfect-home/utils/config.js'),
  ])

  assert.deepEqual(normalizeHome(baseHome).music, { playlist: [] })

  const home = normalizeHome({
    ...baseHome,
    music: {
      playlist: [
        {
          id: 'track-one',
          name: '  First Song  ',
          artist: '  Elin  ',
          url: '/media/music/2026/08/123e4567-e89b-12d3-a456-426614174000.mp3',
          enabled: false,
        },
        {
          id: 'track-two',
          name: 'Second Song',
          artist: '',
          url: 'https://elin521.cn/media/music/2026/08/123e4567-e89b-12d3-a456-426614174001.m4a',
          enabled: true,
        },
      ],
    },
  })
  assert.equal(home.music.playlist[0].name, 'First Song')
  assert.equal(home.music.playlist[0].artist, 'Elin')
  assert.equal(home.music.playlist[0].enabled, false)
  assert.equal(home.music.playlist[1].url, '/media/music/2026/08/123e4567-e89b-12d3-a456-426614174001.m4a')

  const config = makeConfig({ name: 'Elin', contacts: [] }, [], home)
  assert.deepEqual(Object.keys(config.music), ['playlist'])
  assert.equal(config.music.playlist.length, 2)
  assert.equal(config.music.playlist[0].enabled, false)

  assert.throws(
    () => normalizeHome({ ...baseHome, music: { playlist: [{ id: 'bad', name: 'Bad', artist: '', url: 'https://example.com/song.mp3' }] } }),
    /必须使用在线编辑上传到 R2/,
  )
  assert.throws(
    () => normalizeHome({
      ...baseHome,
      music: {
        playlist: [{
          id: 'external', name: 'External', artist: '',
          url: 'https://tracker.example/media/music/2026/08/123e4567-e89b-12d3-a456-426614174004.mp3',
        }],
      },
    }),
    /必须使用在线编辑上传到 R2/,
  )
  assert.throws(
    () => normalizeHome({
      ...baseHome,
      music: {
        playlist: [
          { id: 'same', name: 'One', artist: '', url: '/media/music/2026/08/123e4567-e89b-12d3-a456-426614174002.mp3' },
          { id: 'same', name: 'Two', artist: '', url: '/media/music/2026/08/123e4567-e89b-12d3-a456-426614174003.mp3' },
        ],
      },
    }),
    /歌曲 ID 不能重复/,
  )
})
