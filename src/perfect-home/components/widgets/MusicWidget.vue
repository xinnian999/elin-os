<template>
  <div class="widget music-widget" @click="store.toggleMusicPanel">
    <div class="widget-header">
      <span class="widget-icon">🎵</span>
      <span class="widget-title">音乐</span>
      <span class="playing-status" v-if="isPlaying">▶ 正在播放</span>
    </div>
    <div class="music-content">
      <div class="album-cover" :class="{ playing: isPlaying }">
        <div class="cover-inner">🎵</div>
      </div>
      <div class="music-info">
        <div class="song-title">{{ currentSong?.name || '等待播放' }}</div>
        <div class="song-artist">{{ currentSong?.artist || '点击播放' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mainStore } from '../../store'

const store = mainStore()
const isPlaying = ref(false)
const currentIndex = ref(0)

const currentSong = computed(() => store.songs[currentIndex.value])

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
}

const nextSong = () => {
  currentIndex.value = (currentIndex.value + 1) % store.songs.length
}
</script>

<style lang="scss" scoped>
.music-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(0, 212, 255, 0.5);
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.widget-icon {
  font-size: 20px;
}

.widget-title {
  font-size: 1rem;
  font-weight: 600;
  color: #00d4ff;
}

.playing-status {
  margin-left: auto;
  font-size: 0.8rem;
  color: #00d4ff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.music-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.album-cover {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00d4ff, #7b2ff7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;

  &.playing {
    animation: float 2s ease-in-out infinite;
  }
}

.cover-inner {
  animation: spin 8s linear infinite;

  &.playing {
    animation-play-state: running;
  }
  &:not(.playing) {
    animation-play-state: paused;
  }
}

.music-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
</style>
