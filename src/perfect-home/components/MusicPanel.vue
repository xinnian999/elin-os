<template>
  <div class="music-panel" @click.self="store.musicOpenState = false">
    <div class="panel-content">
      <div class="panel-header">
        <span class="panel-title">🎵 音乐播放器</span>
        <button class="close-btn" @click="store.musicOpenState = false">✕</button>
      </div>

      <div class="player-area">
        <!-- 封面 -->
        <div class="player-cover" :class="{ playing: isPlaying }">
          <img v-if="currentSong?.cover" :src="currentSong.cover" alt="cover" />
          <span v-else>🎵</span>
        </div>

        <!-- 歌曲信息 -->
        <div class="player-info">
          <div class="song-name">{{ currentSong?.name || '等待播放' }}</div>
          <div class="song-artist">{{ currentSong?.artist || '点击播放' }}</div>
        </div>

        <!-- 进度条 -->
        <div class="progress-area">
          <span class="time">{{ formatTime(currentTime) }}</span>
          <div class="progress-bar" @click="seek">
            <div class="progress-bg"></div>
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            <div class="progress-dot" :style="{ left: progress + '%' }"></div>
          </div>
          <span class="time">{{ formatTime(duration) }}</span>
        </div>

        <!-- 控制按钮 -->
        <div class="player-controls">
          <button @click="toggleOrder" :title="orderLabel">{{ orderIcon }}</button>
          <button @click="prevSong">⏮️</button>
          <button class="play-btn" @click="togglePlay">{{ isPlaying ? '⏸️' : '▶️' }}</button>
          <button @click="nextSong">⏭️</button>
          <button @click="toggleLoop" :title="loopLabel">{{ loopIcon }}</button>
        </div>

        <!-- 音量 -->
        <div class="volume-area">
          <span>{{ volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊' }}</span>
          <input type="range" min="0" max="1" step="0.1" v-model="volume" @input="setVolume" />
        </div>

        <!-- 播放列表 -->
        <div class="playlist">
          <div class="playlist-header">播放列表 ({{ playlist.length }})</div>
          <div class="playlist-items">
            <div
              v-for="(song, index) in playlist"
              :key="index"
              class="playlist-item"
              :class="{ active: currentIndex === index }"
              @click="playSong(index)"
            >
              <span class="playing-icon">{{ currentIndex === index && isPlaying ? '🎵' : '▶' }}</span>
              <span class="song-title">{{ song.name }}</span>
              <span class="song-artist">{{ song.artist }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { mainStore } from '../store'

const store = mainStore()

// 播放列表 - 使用真实可用的音乐
const playlist = ref([
  { name: 'Summer Dream', artist: 'Summer', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://picsum.photos/200/200?random=1' },
  { name: 'Night Drive', artist: 'Relaxing', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://picsum.photos/200/200?random=2' },
  { name: 'Ocean Waves', artist: 'Nature', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://picsum.photos/200/200?random=3' },
  { name: 'Mountain View', artist: 'Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', cover: 'https://picsum.photos/200/200?random=4' }
])

const isPlaying = ref(false)
const currentIndex = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const order = ref('list')
const loop = ref('all')

let audio = null

const currentSong = computed(() => playlist.value[currentIndex.value])
const progress = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0)

const orderIcon = computed(() => order.value === 'random' ? '🔀' : '🔁')
const orderLabel = computed(() => order.value === 'random' ? '随机播放' : '顺序播放')
const loopIcon = computed(() => {
  if (loop.value === 'one') return '🔂'
  if (loop.value === 'none') return '⏹️'
  return '🔁'
})
const loopLabel = computed(() => {
  if (loop.value === 'all') return '列表循环'
  if (loop.value === 'one') return '单曲循环'
  return '不循环'
})

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const initAudio = () => {
  if (!audio) {
    audio = new Audio()
    audio.volume = volume.value
    audio.preload = 'metadata'

    audio.addEventListener('timeupdate', () => {
      currentTime.value = audio.currentTime
    })

    audio.addEventListener('loadedmetadata', () => {
      duration.value = audio.duration
    })

    audio.addEventListener('ended', () => {
      if (loop.value === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else if (loop.value === 'none' && currentIndex.value < playlist.value.length - 1) {
        nextSong()
      } else if (loop.value === 'all' || currentIndex.value < playlist.value.length - 1) {
        nextSong()
      } else {
        isPlaying.value = false
      }
    })

    audio.addEventListener('error', (e) => {
      console.error('音频加载失败:', e)
      isPlaying.value = false
    })
  }
}

const loadSong = (index) => {
  initAudio()
  const song = playlist.value[index]
  if (song && song.url) {
    audio.src = song.url
    currentIndex.value = index
    duration.value = 0
    currentTime.value = 0
  }
}

const togglePlay = () => {
  initAudio()

  if (!audio.src && playlist.value.length > 0) {
    loadSong(0)
  }

  if (isPlaying.value) {
    audio.pause()
    isPlaying.value = false
  } else {
    audio.play().then(() => {
      isPlaying.value = true
    }).catch(err => {
      console.error('播放失败:', err)
    })
  }
}

const prevSong = () => {
  if (order.value === 'random') {
    currentIndex.value = Math.floor(Math.random() * playlist.value.length)
  } else {
    currentIndex.value = (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
  }
  loadSong(currentIndex.value)
  if (isPlaying.value) audio.play().catch(() => {})
}

const nextSong = () => {
  if (order.value === 'random') {
    currentIndex.value = Math.floor(Math.random() * playlist.value.length)
  } else {
    currentIndex.value = (currentIndex.value + 1) % playlist.value.length
  }
  loadSong(currentIndex.value)
  if (isPlaying.value) audio.play().catch(() => {})
}

const playSong = (index) => {
  loadSong(index)
  audio.play().then(() => {
    isPlaying.value = true
  }).catch(err => {
    console.error('播放失败:', err)
  })
}

const toggleOrder = () => {
  order.value = order.value === 'list' ? 'random' : 'list'
}

const toggleLoop = () => {
  if (loop.value === 'all') loop.value = 'one'
  else if (loop.value === 'one') loop.value = 'none'
  else loop.value = 'all'
  if (audio) audio.loop = loop.value === 'one'
}

const setVolume = () => {
  if (audio) audio.volume = volume.value
}

const seek = (e) => {
  if (audio && duration.value) {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audio.currentTime = percent * duration.value
  }
}

// 页面卸载时清理
onUnmounted(() => {
  if (audio) {
    audio.pause()
    audio.src = ''
    audio = null
  }
})
</script>

<style lang="scss" scoped>
.music-panel {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.panel-content {
  background: rgba(15, 15, 25, 0.98);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 24px;
  padding: 30px;
  width: 90%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #00d4ff;
}

.close-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 0, 137, 0.3);
  }
}

.player-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.player-cover {
  width: 180px;
  height: 180px;
  margin: 0 auto;
  border-radius: 20px;
  background: linear-gradient(135deg, #00d4ff, #7b2ff7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.4);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.playing {
    animation: rotate 10s linear infinite;
  }
}

.player-info {
  text-align: center;
}

.song-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: #fff;
}

.song-artist {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 6px;
}

.progress-area {
  display: flex;
  align-items: center;
  gap: 12px;

  .time {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    min-width: 40px;
  }
}

.progress-bar {
  flex: 1;
  height: 6px;
  position: relative;
  cursor: pointer;

  .progress-bg {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, #00d4ff, #7b2ff7);
    border-radius: 3px;
  }

  .progress-dot {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 14px;
    height: 14px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 10px #00d4ff;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .progress-dot {
    opacity: 1;
  }
}

.player-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;

  button {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(0, 212, 255, 0.2);
      transform: scale(1.1);
    }
  }

  .play-btn {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #00d4ff, #7b2ff7) !important;
    font-size: 28px !important;
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
  }
}

.volume-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;

  span {
    font-size: 18px;
  }

  input[type="range"] {
    flex: 1;
    height: 6px;
    -webkit-appearance: none;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      background: #00d4ff;
      border-radius: 50%;
      cursor: pointer;
    }
  }
}

.playlist {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
}

.playlist-header {
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.playlist-items {
  max-height: 180px;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(0, 212, 255, 0.1);
  }

  &.active {
    background: rgba(0, 212, 255, 0.2);

    .song-title {
      color: #00d4ff;
    }
  }

  .playing-icon {
    font-size: 12px;
    width: 20px;
  }

  .song-title {
    flex: 1;
    font-size: 0.9rem;
    color: #fff;
  }

  .song-artist {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}
</style>
