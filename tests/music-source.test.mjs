import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))

test('normalizes and validates Xiaolin music source responses', async (t) => {
  const vite = await createServer({ root, logLevel: 'silent', server: { middlewareMode: true } })
  t.after(() => vite.close())
  const source = await vite.ssrLoadModule('/worker/music-source.ts')

  const search = source.parseHylMusicSearch({
    result: {
      songs: [{
        id: 1973665667,
        name: '海屿你',
        dt: 295940,
        ar: [{ id: 13288861, name: '马也_Crabbit' }, { id: 1, name: '合作歌手' }],
        al: { name: '海屿你', picUrl: 'http://p3.music.126.net/cover.jpg' },
      }, { id: null, name: 'invalid' }],
    },
  })
  assert.deepEqual(search, [{
    sourceId: '1973665667',
    name: '海屿你',
    artist: '马也_Crabbit、合作歌手',
    album: '海屿你',
    coverUrl: 'https://p3.music.126.net/cover.jpg',
    durationMs: 295940,
  }])

  const detail = source.parseHylMusicDetail({ songs: [{
    id: 1973665667, name: '海屿你', dt: 295940,
    ar: [{ id: 13288861, name: '马也_Crabbit' }],
    al: { name: '海屿你', picUrl: 'https://p3.music.126.net/cover.jpg' },
  }] }, '1973665667')
  assert.equal(detail.primaryArtistId, '13288861')

  const audio = source.parseHylMusicAudio({ data: [{
    id: 1973665667, code: 200, url: 'http://m801.music.126.net/audio.mp3?token=temporary',
    size: 4_735_917, type: 'mp3', time: 295940, freeTrialInfo: null,
  }] }, '1973665667')
  assert.equal(audio.url, 'https://m801.music.126.net/audio.mp3?token=temporary')
  assert.equal(audio.contentType, 'audio/mpeg')
  assert.equal(source.isSupportedAudioContentType('audio/mpeg; charset=UTF-8', 'mp3'), true)

  assert.throws(() => source.trustedMusicMediaUrl('https://music.126.net.evil.example/song.mp3'), /不受信任/)
  assert.throws(() => source.trustedMusicMediaUrl('https://user:pass@m801.music.126.net/song.mp3'), /不受信任/)
  assert.throws(() => source.parseHylMusicAudio({ data: [{ id: 1973665667, code: 404, url: null }] }, '1973665667'), /没有可完整导入/)
})
