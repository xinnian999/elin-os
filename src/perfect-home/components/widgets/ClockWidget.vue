<template>
  <div class="clock-widget" :class="{ flipped: showMusic }">
    <!-- 正面：时间 -->
    <div class="face face-front" @click="showMusic = true">
      <div class="card-inner">
        <div class="header">
          <span class="icon">🕐</span>
          <span class="title">{{ t('clock') }}</span>
          <span class="mode-badge">{{ isNight ? '🌙' : '☀️' }}</span>
        </div>

        <!-- LED 点状时间 -->
        <div class="led-time">
          <div class="led-digit">
            <div v-for="(row, i) in ledDigits[timeDigits.hour0]" :key="'h0-'+i" class="led-row">
              <span v-for="(dot, j) in row" :key="'h0-'+i+'-'+j" class="led-dot" :class="{ on: dot }"></span>
            </div>
          </div>
          <div class="led-digit">
            <div v-for="(row, i) in ledDigits[timeDigits.hour1]" :key="'h1-'+i" class="led-row">
              <span v-for="(dot, j) in row" :key="'h1-'+i+'-'+j" class="led-dot" :class="{ on: dot }"></span>
            </div>
          </div>
          <div class="led-colon">:</div>
          <div class="led-digit">
            <div v-for="(row, i) in ledDigits[timeDigits.min0]" :key="'m0-'+i" class="led-row">
              <span v-for="(dot, j) in row" :key="'m0-'+i+'-'+j" class="led-dot" :class="{ on: dot }"></span>
            </div>
          </div>
          <div class="led-digit">
            <div v-for="(row, i) in ledDigits[timeDigits.min1]" :key="'m1-'+i" class="led-row">
              <span v-for="(dot, j) in row" :key="'m1-'+i+'-'+j" class="led-dot" :class="{ on: dot }"></span>
            </div>
          </div>
          <div class="led-colon">:</div>
          <div class="led-digit second">
            <div v-for="(row, i) in ledDigits[timeDigits.sec0]" :key="'s0-'+i" class="led-row">
              <span v-for="(dot, j) in row" :key="'s0-'+i+'-'+j" class="led-dot" :class="{ on: dot }"></span>
            </div>
          </div>
          <div class="led-digit second">
            <div v-for="(row, i) in ledDigits[timeDigits.sec1]" :key="'s1-'+i" class="led-row">
              <span v-for="(dot, j) in row" :key="'s1-'+i+'-'+j" class="led-dot" :class="{ on: dot }"></span>
            </div>
          </div>
        </div>

        <div class="date">{{ formattedDate }}</div>
        <div class="greeting">{{ store.greeting }}</div>
      </div>
    </div>

    <!-- 背面：音乐 -->
    <div class="face face-back">
      <div class="card-inner music-card" @click="showMusic = false">
        <div class="header">
          <span class="icon">🎵</span>
          <span class="title">{{ t('music') }}</span>
        </div>

        <!-- 唱片封面 -->
        <div class="album" :class="{ playing: isPlaying }">
          <span class="album-icon">🎵</span>
        </div>

        <!-- 歌曲信息 -->
        <div class="song-info">
          <div class="song">{{ currentSong?.name || t('waiting') }}</div>
          <div class="artist">{{ currentSong?.artist || t('clickPlay') }}</div>
        </div>

        <!-- 播放控制按钮 -->
        <div class="controls-center" @click.stop>
          <button @click.stop="prevSong" class="ctrl-btn" title="上一首">⏮</button>
          <button @click.stop="togglePlay" class="play-btn" :class="{ playing: isPlaying }" :title="isPlaying ? '暂停' : '播放'">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <button @click.stop="nextSong" class="ctrl-btn" title="下一首">⏭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mainStore } from '../../store'

const store = mainStore()
const showMusic = ref(false)
const isPlaying = ref(false)

const lang = ref(localStorage.getItem('lang') || 'zh')
const translations = {
  zh: { clock: '时间', music: '音乐', waiting: '等待播放', clickPlay: '点击播放',
    morning: '早上好', noon: '中午好', afternoon: '下午好', evening: '傍晚好', night: '晚上好' },
  en: { clock: 'Clock', music: 'Music', waiting: 'Waiting', clickPlay: 'Click to play',
    morning: 'Good Morning', noon: 'Good Noon', afternoon: 'Good Afternoon', evening: 'Good Evening', night: 'Good Night' }
}
const t = (key) => translations[lang.value]?.[key] || translations.zh[key]

const isNight = computed(() => {
  const h = new Date().getHours()
  return h < 6 || h >= 18
})

const timeDigits = computed(() => {
  const time = store.timeStr || '00:00:00'
  const h = time.split(':')[0] || '00'
  const m = time.split(':')[1] || '00'
  const s = time.split(':')[2] || '00'
  return { hour0: h[0], hour1: h[1], min0: m[0], min1: m[1], sec0: s[0], sec1: s[1] }
})

const ledDigits = {
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
  '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]]
}

const formattedDate = computed(() => {
  const d = new Date()
  const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return d.toLocaleDateString(lang.value === 'zh' ? 'zh-CN' : 'en-US', opts)
})

const playlist = [
  { name: 'Summer Dream', artist: 'Relaxing', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Night Drive', artist: 'Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Ocean Waves', artist: 'Nature', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
]

let audio = null
const currentIndex = ref(0)
const currentSong = ref(playlist[0])

const initAudio = () => {
  if (!audio) {
    audio = new Audio()
    audio.addEventListener('ended', () => nextSong())
  }
}

const togglePlay = () => {
  initAudio()
  if (isPlaying.value) {
    audio.pause()
    isPlaying.value = false
  } else {
    if (!audio.src) audio.src = currentSong.value.url
    audio.play().then(() => { isPlaying.value = true }).catch(() => {})
  }
}

const prevSong = () => {
  currentIndex.value = (currentIndex.value - 1 + playlist.length) % playlist.length
  currentSong.value = playlist[currentIndex.value]
  if (isPlaying.value) { audio.src = currentSong.value.url; audio.play() }
}

const nextSong = () => {
  currentIndex.value = (currentIndex.value + 1) % playlist.length
  currentSong.value = playlist[currentIndex.value]
  if (isPlaying.value) { audio.src = currentSong.value.url; audio.play() }
}
</script>

<style lang="scss" scoped>
.clock-widget {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 0;
  min-height: 160px;
  perspective: 1000px;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;

  &:hover {
    border-color: rgba(0, 212, 255, 0.5);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
  }
}

.face {
  width: 100%;
  backface-visibility: hidden;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.face-front {
  transform: rotateY(0deg);
  z-index: 2;
}

.face-back {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(0, 212, 255, 0.08);
  transform: rotateY(180deg);
}

.flipped {
  .face-front { transform: rotateY(-180deg); }
  .face-back { transform: rotateY(0deg); }
}

.card-inner {
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.music-card {
  min-height: 160px;
  height: 100%;
  justify-content: center;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  width: 100%;

  .icon { font-size: 14px; }
  .title { font-size: 0.75rem; color: #00d4ff; font-weight: 600; }
  .mode-badge { margin-left: auto; font-size: 12px; }
}

.led-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin: 4px 0;
}

.led-digit {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &.second { opacity: 0.8; }
}

.led-colon {
  font-size: 1.2rem;
  font-weight: bold;
  color: #00d4ff;
  margin: 0 3px;
}

.led-row { display: flex; gap: 2px; }

.led-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);

  &.on {
    background: #00d4ff;
    box-shadow: 0 0 5px #00d4ff;
  }
}

.date {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-top: 8px;
}

.greeting {
  font-size: 0.75rem;
  color: var(--theme-primary);
  text-align: center;
  margin-top: 6px;
  font-weight: 500;
  text-shadow: 0 0 10px var(--theme-glow);
}

// 音乐卡片
.album {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff0089, #7b2ff7);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0;

  &.playing { animation: spin 8s linear infinite; }
}

.album-icon { font-size: 18px; }

.song-info {
  text-align: center;
  margin-bottom: 6px;
}

.song {
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
}

.artist {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

// 控制按钮
.controls-center {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
}

.ctrl-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { background: rgba(255, 0, 137, 0.3); }
}

.play-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff0089, #7b2ff7);
  border: none;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &.playing { animation: spin 8s linear infinite; }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
