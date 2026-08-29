<template>
  <div class="widget music-widget" @keydown.stop>
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
      <span class="player-status" :class="{ error: errorMessage }" :title="errorMessage">{{ playerStatus }}</span>
    </div>

    <template v-if="currentSong">
      <div class="player-main">
        <div class="music-disc" :class="{ playing: isPlaying }" aria-hidden="true"><span>♪</span></div>
        <div class="track-meta">
          <strong :title="currentSong.name">{{ currentSong.name }}</strong>
          <span :title="currentSong.artist || '未知歌手'">{{ currentSong.artist || '未知歌手' }}</span>
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

    <span class="sr-only" aria-live="polite">{{ liveMessage }}</span>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { mainStore } from '../../store'

const store = mainStore()
const audioElement = ref(null)
const currentIndex = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const liveMessage = ref('')
let resumeAfterSourceChange = false
let sourceChangeToken = 0

const playlist = computed(() => (store.config?.music?.playlist || []).filter((song) => song.enabled !== false && song.url))
const currentSong = computed(() => playlist.value[currentIndex.value] || null)
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

watch(playlist, (songs) => {
  if (!songs.length) currentIndex.value = 0
  else if (currentIndex.value >= songs.length) currentIndex.value = 0
}, { deep: true })

watch(() => store.musicVolume, (volume) => {
  if (audioElement.value) audioElement.value.volume = clampVolume(volume)
}, { immediate: true })

onBeforeUnmount(() => {
  sourceChangeToken += 1
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
.widget-header { display: flex; align-items: center; gap: 7px; margin-bottom: 9px; }
.widget-icon { font-size: 15px; }.widget-title { color: var(--theme-primary); font-size: .84rem; font-weight: 700; }
.player-status { margin-left: auto; color: rgba(255,255,255,.42); font-size: .66rem; font-variant-numeric: tabular-nums; }.player-status.error { color: #ff7199; }
.player-main { display: grid; grid-template-columns: 42px minmax(0,1fr) auto; align-items: center; gap: 10px; }
.music-disc { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: radial-gradient(circle at center,rgba(10,16,31,.95) 0 18%,transparent 19%),var(--theme-gradient); box-shadow: 0 0 18px color-mix(in srgb,var(--theme-primary) 26%,transparent); }.music-disc span { transform: translateX(1px); font-size: 16px; }
.music-disc.playing { animation: disc-spin 7s linear infinite; }
.track-meta { min-width: 0; display: grid; gap: 3px; }.track-meta strong,.track-meta span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.track-meta strong { color: rgba(255,255,255,.92); font-size: .8rem; }.track-meta span { color: rgba(255,255,255,.45); font-size: .67rem; }
.player-controls { display: flex; align-items: center; gap: 5px; }.player-controls button { width: 32px; height: 32px; display: grid; place-items: center; padding: 0; border: 1px solid rgba(255,255,255,.12); border-radius: 9px; color: rgba(255,255,255,.82); background: rgba(255,255,255,.065); cursor: pointer; font-size: 17px; line-height: 1; transition: color .15s ease,border-color .15s ease,background .15s ease,transform .15s ease; }.player-controls button:hover:not(:disabled),.player-controls button:focus-visible { color: #fff; border-color: var(--theme-primary); background: color-mix(in srgb,var(--theme-primary) 18%,transparent); outline: none; }.player-controls button:active:not(:disabled) { transform: scale(.94); }.player-controls button:disabled { opacity: .28; cursor: default; }.player-controls .play-button { color: #fff; border-color: transparent; background: var(--theme-gradient); font-size: 12px; }
.progress-row { display: grid; grid-template-columns: 29px minmax(0,1fr) 29px; align-items: center; gap: 6px; margin-top: 10px; }.progress-row span { color: rgba(255,255,255,.38); font-size: .58rem; font-variant-numeric: tabular-nums; }.progress-row span:last-child { text-align: right; }.progress-row input { width: 100%; height: 18px; margin: 0; padding: 0; border: 0; border-radius: 0; appearance: none; background: transparent; cursor: pointer; }.progress-row input::-webkit-slider-runnable-track { height: 3px; border-radius: 99px; background: linear-gradient(to right,var(--theme-primary) 0 var(--played),rgba(255,255,255,.13) var(--played) 100%); }.progress-row input::-webkit-slider-thumb { width: 10px; height: 10px; margin-top: -3.5px; appearance: none; border: 2px solid #fff; border-radius: 50%; background: var(--theme-primary); }.progress-row input::-moz-range-track { height: 3px; border-radius: 99px; background: rgba(255,255,255,.13); }.progress-row input::-moz-range-progress { height: 3px; background: var(--theme-primary); }.progress-row input::-moz-range-thumb { width: 8px; height: 8px; border: 2px solid #fff; border-radius: 50%; background: var(--theme-primary); }.progress-row input:focus-visible { outline: 2px solid var(--theme-primary); outline-offset: 2px; }.progress-row input:disabled { opacity: .45; cursor: default; }
.empty-player { min-height: 75px; display: grid; place-content: center; gap: 5px; color: rgba(255,255,255,.4); text-align: center; }.empty-player strong { color: rgba(255,255,255,.72); font-size: .8rem; }.empty-player span { font-size: .67rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@keyframes disc-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .music-widget,.player-controls button { transition: none; }.music-disc.playing { animation: none; } }
@media (min-width: 901px) {
  .music-widget { display: flex; flex-direction: column; }
  .widget-header { flex: 0 0 auto; }
  .player-main,
  .progress-row {
    width: min(100%, 216px);
    margin-inline: auto;
  }
  .player-main {
    grid-template-columns: 40px minmax(0,1fr) auto;
    gap: 8px;
    margin-top: auto;
  }
  .music-disc { width: 40px; height: 40px; }
  .player-controls { gap: 4px; }
  .player-controls button { width: 30px; height: 30px; }
  .player-controls .play-button { width: 32px; height: 32px; }
  .progress-row { margin-bottom: auto; }
  .empty-player { flex: 1; min-height: 0; }
}
@media (max-width: 520px) { .player-controls button { width: 36px; height: 36px; }.player-main { grid-template-columns: 40px minmax(0,1fr) auto; gap: 8px; }.music-disc { width: 40px; height: 40px; } }
</style>
