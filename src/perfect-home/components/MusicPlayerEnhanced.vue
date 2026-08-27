<template>
  <div class="music-player-enhanced">
    <div class="player-header">
      <span class="player-title">🎵 音乐播放器</span>
      <button @click="togglePlayer" class="close-btn">✕</button>
    </div>

    <!-- 当前播放 -->
    <div class="now-playing" v-if="currentSong">
      <div class="album-art">
        <img :src="currentSong.cover || 'https://via.placeholder.com/200'" :alt="currentSong.name" />
      </div>
      <div class="song-info">
        <div class="song-name">{{ currentSong.name }}</div>
        <div class="song-artist">{{ currentSong.artist }}</div>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-section">
      <div class="time">{{ formatTime(currentTime) }}</div>
      <input
        v-model.number="currentTime"
        type="range"
        min="0"
        :max="duration"
        class="progress-bar"
        @change="seek"
      />
      <div class="time">{{ formatTime(duration) }}</div>
    </div>

    <!-- 歌词显示 -->
    <div class="lyrics" v-if="currentSong?.lyrics">
      <div class="lyric-line">{{ currentLyric }}</div>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <button @click="previousSong" class="control-btn">⏮️</button>
      <button @click="togglePlay" class="control-btn play-btn">
        {{ isPlaying ? '⏸️' : '▶️' }}
      </button>
      <button @click="nextSong" class="control-btn">⏭️</button>
      <button @click="toggleLoop" class="control-btn" :class="{ active: loopMode !== 'off' }">
        {{ loopMode === 'all' ? '🔁' : loopMode === 'one' ? '🔂' : '➡️' }}
      </button>
    </div>

    <!-- 音量控制 -->
    <div class="volume-control">
      <span class="volume-icon">🔊</span>
      <input
        v-model.number="volume"
        type="range"
        min="0"
        max="1"
        step="0.1"
        class="volume-slider"
        @change="updateVolume"
      />
      <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
    </div>

    <!-- 播放列表 -->
    <div class="playlist">
      <div class="playlist-header">播放列表</div>
      <div class="playlist-items">
        <div
          v-for="(song, i) in playlist"
          :key="i"
          class="playlist-item"
          :class="{ active: i === currentIndex }"
          @click="playSong(i)"
        >
          <span class="item-index">{{ i + 1 }}</span>
          <span class="item-name">{{ song.name }}</span>
          <span class="item-artist">{{ song.artist }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mainStore } from '../store'

const store = mainStore()

const isPlaying = ref(false)
const currentIndex = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.5)
const loopMode = ref('all') // off, all, one
const currentLyric = ref('')

const playlist = computed(() => store.config?.music?.playlist || [
  { name: 'Demo Song 1', artist: 'Artist 1', url: '', cover: '', lyrics: '' },
  { name: 'Demo Song 2', artist: 'Artist 2', url: '', cover: '', lyrics: '' }
])

const currentSong = computed(() => playlist.value[currentIndex.value])

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const togglePlayer = () => {
  store.musicOpenState = false
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
}

const previousSong = () => {
  currentIndex.value = (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
  currentTime.value = 0
}

const nextSong = () => {
  currentIndex.value = (currentIndex.value + 1) % playlist.value.length
  currentTime.value = 0
}

const playSong = (index) => {
  currentIndex.value = index
  currentTime.value = 0
  isPlaying.value = true
}

const toggleLoop = () => {
  const modes = ['all', 'one', 'off']
  const current = modes.indexOf(loopMode.value)
  loopMode.value = modes[(current + 1) % modes.length]
}

const seek = () => {
  // 实际应用中这里会控制音频元素
}

const updateVolume = () => {
  // 实际应用中这里会更新音频音量
}
</script>

<style lang="scss" scoped>
.music-player-enhanced {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(20px);
  z-index: 98;
  max-height: 80vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.3);
    border-radius: 2px;
  }
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.player-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--theme-primary);
}

.close-btn {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: rgba(255, 0, 100, 0.3);
  }
}

.now-playing {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.album-art {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.song-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.song-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  min-width: 30px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--theme-primary);
    cursor: pointer;
  }
}

.lyrics {
  text-align: center;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(0, 212, 255, 0.05);
  border-radius: 6px;
}

.lyric-line {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.control-btn {
  width: 36px;
  height: 36px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
  }

  &.play-btn {
    width: 44px;
    height: 44px;
    background: var(--theme-gradient);
    border: none;
    font-size: 18px;
  }

  &.active {
    background: rgba(0, 212, 255, 0.3);
    border-color: var(--theme-primary);
  }
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.volume-icon {
  font-size: 14px;
}

.volume-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--theme-primary);
    cursor: pointer;
  }
}

.volume-value {
  min-width: 35px;
  text-align: right;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.playlist {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
}

.playlist-header {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.playlist-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.75rem;

  &:hover {
    background: rgba(0, 212, 255, 0.1);
  }

  &.active {
    background: rgba(0, 212, 255, 0.2);
    color: var(--theme-primary);
  }
}

.item-index {
  min-width: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.item-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-artist {
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}
</style>
