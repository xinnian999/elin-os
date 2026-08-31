<template>
  <div class="widget music-widget" @keydown.esc.stop.prevent="closePlaylist" @keydown.stop>
    <audio
      ref="audioElement"
      :src="currentSong?.url || undefined"
      preload="metadata"
      @loadstart="isLoading = true"
      @loadedmetadata="handleLoadedMetadata"
      @canplay="isLoading = false"
      @timeupdate="handleTimeUpdate"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="handleEnded"
      @error="handleError"
    />

    <div class="widget-header">
      <span class="widget-icon">🎵</span>
      <span class="widget-title">万万静听</span>
      <button
        ref="playlistToggle"
        type="button"
        class="playlist-toggle"
        :aria-expanded="showPlaylist"
        :aria-label="showPlaylist ? '返回播放器' : '切换播放列表'"
        aria-controls="music-playlist"
        :disabled="!playlist.length"
        @click="togglePlaylist"
      >
        <span class="playlist-menu-icon" aria-hidden="true"><i /><i /><i /></span>
      </button>
    </div>

    <div
      v-if="showPlaylist && playlist.length"
      id="music-playlist"
      class="playlist-view"
      role="region"
      aria-label="播放列表"
    >
      <button
        v-for="(song, index) in playlist"
        :key="song.id || `${song.name}-${index}`"
        type="button"
        class="playlist-song"
        :class="{ active: index === currentIndex }"
        :aria-current="index === currentIndex ? 'true' : undefined"
        @click="choosePlaylistSong(index)"
      >
        <span class="playlist-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="playlist-copy">
          <strong :title="song.name">{{ song.name }}</strong>
          <small :title="song.artist || '未知歌手'">{{ song.artist || '未知歌手' }}</small>
        </span>
        <span v-if="index === currentIndex" class="playlist-current">{{ isPlaying ? '播放中' : '当前' }}</span>
      </button>
    </div>

    <template v-else-if="currentSong">
      <div class="player-main">
        <div class="track-summary">
          <div class="music-disc" :class="{ playing: isPlaying }" aria-hidden="true">
            <img v-if="currentCover" :src="currentCover" alt="" />
            <span v-else>♪</span>
          </div>
          <div class="track-meta">
            <strong :title="currentSong.name">{{ currentSong.name }}</strong>
            <span :title="currentSong.artist || '未知歌手'">{{ currentSong.artist || '未知歌手' }}</span>
            <small v-if="currentLyric" :title="lyricTitle">{{ currentLyric }}</small>
          </div>
        </div>
        <div class="player-controls">
          <button type="button" aria-label="上一首" title="上一首" :disabled="playlist.length < 2" @click="previousSong">‹</button>
          <button
            type="button"
            class="play-button"
            :aria-label="isPlaying ? '暂停' : '播放'"
            :aria-pressed="isPlaying"
            :title="isPlaying ? '暂停' : '播放'"
            @click="togglePlay"
          >{{ isPlaying ? 'Ⅱ' : '▶' }}</button>
          <button type="button" aria-label="下一首" title="下一首" :disabled="playlist.length < 2" @click="nextSong">›</button>
        </div>
      </div>

      <div class="progress-row">
        <span>{{ formatTime(currentTime) }}</span>
        <input
          type="range"
          min="0"
          :max="duration || 0"
          step="0.1"
          :value="Math.min(currentTime, duration || 0)"
          :style="{ '--played': `${progressPercent}%` }"
          :disabled="!duration"
          aria-label="播放进度"
          @input="seek"
        />
        <span>{{ formatTime(duration) }}</span>
      </div>
    </template>

    <div v-else class="empty-player">
      <strong>暂无歌曲</strong>
      <span>请在在线编辑的“万万静听”中上传</span>
    </div>

    <span class="sr-only" aria-live="polite">{{ liveMessage || playerStatus }}</span>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { mainStore } from '../../store'
import { lyricAt, parseLyricPayload } from '../../utils/music-lyrics'

const store = mainStore()
const audioElement = ref(null)
const playlistToggle = ref(null)
const currentIndex = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const liveMessage = ref('')
const showPlaylist = ref(false)
const lyricLines = ref([])
const translatedLyricLines = ref([])
let lyricController = null
let resumeAfterSourceChange = false
let sourceChangeToken = 0

const playlist = computed(() => (store.config?.music?.playlist || []).filter((song) => song.enabled !== false && song.url))
const currentSong = computed(() => playlist.value[currentIndex.value] || null)
const currentCover = computed(() => currentSong.value?.coverUrl || currentSong.value?.artistAvatarUrl || '')
const currentLyric = computed(() => lyricAt(lyricLines.value, currentTime.value))
const translatedLyric = computed(() => lyricAt(translatedLyricLines.value, currentTime.value))
const lyricTitle = computed(() => [currentLyric.value, translatedLyric.value].filter(Boolean).join('\n'))
const progressPercent = computed(() => duration.value > 0 ? Math.min(100, currentTime.value / duration.value * 100) : 0)
const playerStatus = computed(() => {
  if (!currentSong.value) return '待配置'
  if (errorMessage.value) return '不可用'
  if (isLoading.value) return '加载中'
  if (isPlaying.value) return '播放中'
  return `${currentIndex.value + 1} / ${playlist.value.length}`
})

const clampVolume = (value) => Math.max(0, Math.min(1, Number(value) || 0))
const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

const play = async () => {
  if (!audioElement.value || !currentSong.value) return
  const token = sourceChangeToken
  errorMessage.value = ''
  try { await audioElement.value.play() }
  catch (error) {
    if (token !== sourceChangeToken || error?.name === 'AbortError') return
    isPlaying.value = false
    errorMessage.value = '暂时无法播放，请重试'
    liveMessage.value = errorMessage.value
  }
}

const togglePlay = () => {
  if (!audioElement.value) return
  if (audioElement.value.paused || audioElement.value.ended) play()
  else audioElement.value.pause()
}

const selectSong = (index, shouldPlay = isPlaying.value) => {
  if (!playlist.value.length) return
  const normalizedIndex = (index + playlist.value.length) % playlist.value.length
  if (normalizedIndex === currentIndex.value) {
    if (audioElement.value) audioElement.value.currentTime = 0
    if (shouldPlay) play()
    return
  }
  resumeAfterSourceChange = shouldPlay
  currentIndex.value = normalizedIndex
}

const previousSong = () => selectSong(currentIndex.value - 1)
const nextSong = () => selectSong(currentIndex.value + 1)
const closePlaylist = () => {
  if (!showPlaylist.value) return
  showPlaylist.value = false
  nextTick(() => playlistToggle.value?.focus())
}
const togglePlaylist = () => {
  if (!playlist.value.length) return
  if (showPlaylist.value) closePlaylist()
  else showPlaylist.value = true
}
const choosePlaylistSong = (index) => {
  if (index !== currentIndex.value) selectSong(index)
  closePlaylist()
}
const handleEnded = () => {
  if (!playlist.value.length) return
  if (store.playerLoop === 'one') {
    if (audioElement.value) audioElement.value.currentTime = 0
    play()
    return
  }
  if (store.playerOrder === 'random' && playlist.value.length > 1) {
    let nextIndex = currentIndex.value
    while (nextIndex === currentIndex.value) nextIndex = Math.floor(Math.random() * playlist.value.length)
    selectSong(nextIndex, true)
    return
  }
  if (store.playerLoop === 'none' && currentIndex.value === playlist.value.length - 1) {
    isPlaying.value = false
    currentTime.value = duration.value
    liveMessage.value = '播放结束'
    return
  }
  selectSong(currentIndex.value + 1, true)
}

const handleLoadedMetadata = () => {
  duration.value = Number.isFinite(audioElement.value?.duration) ? audioElement.value.duration : 0
  isLoading.value = false
}
const handleTimeUpdate = () => { currentTime.value = audioElement.value?.currentTime || 0 }
const handleError = () => {
  if (!currentSong.value) return
  isLoading.value = false
  isPlaying.value = false
  errorMessage.value = '音频加载失败，可切换歌曲或重新上传'
  liveMessage.value = errorMessage.value
}
const seek = (event) => {
  const time = Number(event.currentTarget.value)
  if (!audioElement.value || !Number.isFinite(time)) return
  audioElement.value.currentTime = time
  currentTime.value = time
}

watch(() => currentSong.value?.url, async (url) => {
  const token = ++sourceChangeToken
  currentTime.value = 0
  duration.value = 0
  errorMessage.value = ''
  await nextTick()
  if (token !== sourceChangeToken || !audioElement.value) return
  audioElement.value.pause()
  audioElement.value.volume = clampVolume(store.musicVolume)
  if (!url) {
    audioElement.value.removeAttribute('src')
    audioElement.value.load()
    return
  }
  audioElement.value.load()
  const shouldPlay = resumeAfterSourceChange
  resumeAfterSourceChange = false
  if (shouldPlay) play()
}, { immediate: true })

watch(() => currentSong.value?.lyricUrl, async (url) => {
  lyricController?.abort()
  lyricLines.value = []
  translatedLyricLines.value = []
  if (!url) return
  const controller = new AbortController()
  lyricController = controller
  try {
    const response = await fetch(url, { credentials: 'same-origin', signal: controller.signal })
    if (!response.ok) throw new Error(`歌词加载失败（${response.status}）`)
    const lyrics = parseLyricPayload(await response.text())
    if (controller.signal.aborted) return
    lyricLines.value = lyrics.lines
    translatedLyricLines.value = lyrics.translatedLines
  } catch (error) {
    if (error?.name !== 'AbortError') {
      lyricLines.value = []
      translatedLyricLines.value = []
    }
  }
}, { immediate: true })

watch(playlist, (songs) => {
  if (!songs.length) {
    currentIndex.value = 0
    showPlaylist.value = false
  }
  else if (currentIndex.value >= songs.length) currentIndex.value = 0
}, { deep: true })

watch(() => store.musicVolume, (volume) => {
  if (audioElement.value) audioElement.value.volume = clampVolume(volume)
}, { immediate: true })

onBeforeUnmount(() => {
  sourceChangeToken += 1
  lyricController?.abort()
  if (!audioElement.value) return
  audioElement.value.pause()
  audioElement.value.removeAttribute('src')
  audioElement.value.load()
})
</script>

<style lang="scss" scoped>
.music-widget {
  min-height: 140px;
  padding: 14px 16px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 16px;
  background: rgba(255,255,255,.05);
  backdrop-filter: blur(20px);
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
}
.music-widget:hover { transform: translateY(-2px); border-color: color-mix(in srgb,var(--theme-primary) 55%,transparent); box-shadow: 0 8px 24px var(--theme-glow); }
audio { display: none; }
.widget-header { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
.widget-icon { font-size: 15px; }.widget-title { color: var(--theme-primary); font-size: .84rem; font-weight: 700; }
.playlist-toggle { width: 26px; height: 24px; margin-left: auto; padding: 0; display: grid; place-items: center; border-radius: 7px; color: rgba(255,255,255,.48); background: transparent; cursor: pointer; transition: color .15s ease,background .15s ease; }.playlist-toggle:hover:not(:disabled),.playlist-toggle:focus-visible { color: var(--theme-primary); background: rgba(255,255,255,.06); outline: none; }.playlist-toggle:focus-visible { box-shadow: 0 0 0 1px color-mix(in srgb,var(--theme-primary) 45%,transparent); }.playlist-toggle:disabled { opacity: .35; cursor: default; }.playlist-menu-icon { width: 13px; display: grid; gap: 2px; }.playlist-menu-icon i { width: 100%; height: 1.5px; display: block; border-radius: 99px; background: currentColor; }
.playlist-view { min-height: 0; display: grid; align-content: start; gap: 5px; overflow-y: auto; overscroll-behavior-y: contain; padding: 2px 3px 2px 0; }
.playlist-song { min-width: 0; display: grid; grid-template-columns: 23px minmax(0,1fr) auto; align-items: center; gap: 7px; padding: 6px 7px; border: 1px solid rgba(255,255,255,.08); border-radius: 8px; color: inherit; background: rgba(255,255,255,.035); text-align: left; transition: border-color .15s ease,background .15s ease; }.playlist-song:hover,.playlist-song:focus-visible { border-color: color-mix(in srgb,var(--theme-primary) 42%,transparent); background: color-mix(in srgb,var(--theme-primary) 9%,transparent); outline: none; }.playlist-song.active { border-color: color-mix(in srgb,var(--theme-primary) 28%,transparent); background: color-mix(in srgb,var(--theme-primary) 7%,transparent); }
.playlist-index { color: rgba(255,255,255,.32); font-size: .58rem; font-variant-numeric: tabular-nums; }.playlist-copy { min-width: 0; display: grid; gap: 1px; }.playlist-copy strong,.playlist-copy small { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.playlist-copy strong { color: rgba(255,255,255,.84); font-size: .68rem; }.playlist-copy small { color: rgba(255,255,255,.4); font-size: .58rem; }.playlist-current { color: var(--theme-primary); font-size: .56rem; white-space: nowrap; }
.player-main { display: grid; gap: 6px; }
.track-summary { min-width: 0; display: grid; grid-template-columns: 42px minmax(0,1fr); align-items: center; gap: 10px; }
.music-disc { position: relative; width: 42px; height: 42px; display: grid; place-items: center; overflow: hidden; border-radius: 50%; color: #fff; background: radial-gradient(circle at center,rgba(10,16,31,.95) 0 18%,transparent 19%),var(--theme-gradient); box-shadow: 0 0 18px color-mix(in srgb,var(--theme-primary) 26%,transparent); }.music-disc img { width: 100%; height: 100%; object-fit: cover; }.music-disc:has(img)::after { position: absolute; inset: 39%; content: ''; border: 1px solid rgba(255,255,255,.45); border-radius: 50%; background: rgba(9,13,27,.9); box-shadow: 0 0 0 2px rgba(0,0,0,.16); }.music-disc span { transform: translateX(1px); font-size: 16px; }
.music-disc.playing { animation: disc-spin 7s linear infinite; }
.track-meta { min-width: 0; width: 100%; display: grid; gap: 2px; }.track-meta strong,.track-meta span,.track-meta small { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.track-meta strong { color: rgba(255,255,255,.92); font-size: .8rem; }.track-meta span { color: rgba(255,255,255,.45); font-size: .67rem; }.track-meta small { color: color-mix(in srgb,var(--theme-primary) 70%,rgba(255,255,255,.5)); font-size: .61rem; font-weight: 450; }
.player-controls { width: max-content; min-width: 0; display: flex; align-items: center; justify-content: center; justify-self: center; gap: 4px; }.player-controls button { width: 26px; height: 26px; display: grid; place-items: center; padding: 0; border: 1px solid rgba(255,255,255,.12); border-radius: 50%; color: rgba(255,255,255,.82); background: rgba(255,255,255,.065); cursor: pointer; font-size: 14px; line-height: 1; transition: color .15s ease,border-color .15s ease,background .15s ease,transform .15s ease; }.player-controls button:hover:not(:disabled),.player-controls button:focus-visible { color: #fff; border-color: var(--theme-primary); background: color-mix(in srgb,var(--theme-primary) 18%,transparent); outline: none; }.player-controls button:active:not(:disabled) { transform: scale(.94); }.player-controls button:disabled { opacity: .28; cursor: default; }.player-controls .play-button { width: 28px; height: 28px; color: #fff; border-color: transparent; background: var(--theme-gradient); font-size: 10px; }
.progress-row { display: grid; grid-template-columns: 29px minmax(0,1fr) 29px; align-items: center; gap: 6px; margin-top: 4px; }.progress-row span { color: rgba(255,255,255,.38); font-size: .58rem; font-variant-numeric: tabular-nums; }.progress-row span:last-child { text-align: right; }.progress-row input { width: 100%; height: 18px; margin: 0; padding: 0; border: 0; border-radius: 0; appearance: none; background: transparent; cursor: pointer; }.progress-row input::-webkit-slider-runnable-track { height: 3px; border-radius: 99px; background: linear-gradient(to right,var(--theme-primary) 0 var(--played),rgba(255,255,255,.13) var(--played) 100%); }.progress-row input::-webkit-slider-thumb { width: 10px; height: 10px; margin-top: -3.5px; appearance: none; border: 2px solid #fff; border-radius: 50%; background: var(--theme-primary); }.progress-row input::-moz-range-track { height: 3px; border-radius: 99px; background: rgba(255,255,255,.13); }.progress-row input::-moz-range-progress { height: 3px; background: var(--theme-primary); }.progress-row input::-moz-range-thumb { width: 8px; height: 8px; border: 2px solid #fff; border-radius: 50%; background: var(--theme-primary); }.progress-row input:focus-visible { outline: 2px solid var(--theme-primary); outline-offset: 2px; }.progress-row input:disabled { opacity: .45; cursor: default; }
.empty-player { min-height: 75px; display: grid; place-content: center; gap: 5px; color: rgba(255,255,255,.4); text-align: center; }.empty-player strong { color: rgba(255,255,255,.72); font-size: .8rem; }.empty-player span { font-size: .67rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@keyframes disc-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .music-widget,.player-controls button { transition: none; }.music-disc.playing { animation: none; } }
@media (min-width: 901px) {
  .music-widget { display: flex; flex-direction: column; }
  .widget-header { flex: 0 0 auto; }
  .playlist-view { flex: 1; }
  .player-main,
  .progress-row {
    width: min(100%, 240px);
    margin-inline: auto;
  }
  .player-main {
    margin-top: auto;
  }
  .track-summary { grid-template-columns: 40px minmax(0,1fr); }
  .music-disc { width: 40px; height: 40px; }
  .player-controls { gap: 4px; }
  .player-controls button { width: 24px; height: 24px; }
  .player-controls .play-button { width: 26px; height: 26px; }
  .progress-row { margin-bottom: auto; }
  .empty-player { flex: 1; min-height: 0; }
}
@media (min-width: 901px) and (max-height: 640px) {
  .music-widget { padding-block: 7px; }
  .widget-header { margin-bottom: 2px; }
  .player-main { gap: 3px; }
  .track-summary { grid-template-columns: 32px minmax(0,1fr); gap: 7px; }
  .music-disc { width: 32px; height: 32px; }
  .track-meta { gap: 1px; }
  .player-controls { justify-self: center; gap: 3px; }
  .player-controls button { width: 22px; height: 22px; }
  .player-controls .play-button { width: 24px; height: 24px; }
  .progress-row { margin-top: 1px; }
}
@media (max-width: 520px) { .player-controls button { width: 32px; height: 32px; }.player-controls .play-button { width: 34px; height: 34px; }.player-main { gap: 6px; }.track-summary { grid-template-columns: 40px minmax(0,1fr); gap: 10px; }.music-disc { width: 40px; height: 40px; } }
</style>
