<template>
  <div class="card music-card">
    <div class="card-header">
      <span class="title">🎵 音乐播放</span>
    </div>
    <div class="music-content">
      <div class="album" :class="{ playing: isPlaying }">
        <div class="cover">🎵</div>
      </div>
      <div class="info">
        <div class="song">{{ songs[currentSong].name }}</div>
        <div class="artist">{{ songs[currentSong].artist }}</div>
      </div>
      <div class="controls">
        <button class="ctrl-btn" @click="prevSong">
          <Icon size="18"><SkipPrevious /></Icon>
        </button>
        <button class="play-btn" @click="togglePlay">
          <Icon size="24">
            <component :is="isPlaying ? Pause : Play" />
          </Icon>
        </button>
        <button class="ctrl-btn" @click="nextSong">
          <Icon size="18"><SkipNext /></Icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useMainStore } from '@/store'
import { Icon } from '@vicons/utils'
import { Play, Pause, SkipPrevious, SkipNext } from '@vicons/ionicons5'

const store = useMainStore()
const isPlaying = ref(false)
const currentSong = ref(0)

const songs = [
  { name: '晴天', artist: '周杰伦' },
  { name: '七里香', artist: '周杰伦' },
  { name: '夜曲', artist: '周杰伦' },
  { name: '稻香', artist: '周杰伦' }
]

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  store.setPlayerState(isPlaying.value)
  if (isPlaying.value) {
    store.setPlayerData(songs[currentSong.value].name, songs[currentSong.value].artist)
    store.setPlayerLrc('正在播放: ' + songs[currentSong.value].name)
  } else {
    store.setPlayerLrc('已暂停')
  }
}

const prevSong = () => {
  currentSong.value = (currentSong.value - 1 + songs.length) % songs.length
  if (isPlaying.value) {
    store.setPlayerData(songs[currentSong.value].name, songs[currentSong.value].artist)
    store.setPlayerLrc('正在播放: ' + songs[currentSong.value].name)
  }
}

const nextSong = () => {
  currentSong.value = (currentSong.value + 1) % songs.length
  if (isPlaying.value) {
    store.setPlayerData(songs[currentSong.value].name, songs[currentSong.value].artist)
    store.setPlayerLrc('正在播放: ' + songs[currentSong.value].name)
  }
}
</script>

<style lang="scss" scoped>
.music-card {
  .music-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .album {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: $gradient-primary;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;

      &.playing {
        animation: spin 3s linear infinite;
      }
    }

    .info {
      flex: 1;
      min-width: 0;

      .song {
        font-size: 15px;
        font-weight: 600;
        color: $text;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .artist {
        font-size: 13px;
        color: $text-light;
        margin-top: 4px;
      }
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 8px;

      .ctrl-btn, .play-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        color: $text;
        transition: $transition;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      .play-btn {
        width: 48px;
        height: 48px;
        background: $gradient-primary;

        &:hover {
          transform: scale(1.1);
        }
      }
    }
  }
}
</style>
