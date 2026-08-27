<template>
  <div class="card pomodoro-card">
    <div class="card-header">
      <span class="title">🍅 番茄钟</span>
    </div>
    <div class="pomodoro-content">
      <div class="timer-display">
        <span class="time">{{ displayTime }}</span>
        <span class="mode">{{ modeText }}</span>
      </div>
      <div class="controls">
        <button class="ctrl-btn" @click="resetTimer" title="重置">
          <Icon size="20"><Refresh /></Icon>
        </button>
        <button class="play-btn" @click="toggleTimer">
          <Icon size="24">
            <component :is="isRunning ? Pause : Play" />
          </Icon>
        </button>
        <button class="ctrl-btn" @click="skipTimer" title="跳过">
          <Icon size="20"><SkipForward /></Icon>
        </button>
      </div>
      <div class="stats">
        <div class="stat">
          <span class="value">{{ store.pomoSessions }}</span>
          <span class="label">完成次数</span>
        </div>
        <div class="stat">
          <span class="value">{{ totalHours }}</span>
          <span class="label">专注小时</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useMainStore } from '@/store'
import { Icon } from '@vicons/utils'
import { Play, Pause, Refresh, SkipForward } from '@vicons/ionicons5'

const store = useMainStore()

const isRunning = ref(false)
const currentMode = ref('focus') // focus, short, long
const timeLeft = ref(store.pomoTime * 60) // 秒
let timer = null

const modeText = computed(() => {
  const modes = { focus: '专注中', short: '短休息', long: '长休息' }
  return modes[currentMode.value]
})

const displayTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

const totalHours = computed(() => {
  return (store.pomoTotalMinutes / 60).toFixed(1)
})

const toggleTimer = () => {
  isRunning.value = !isRunning.value
  if (isRunning.value) {
    timer = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
        store.pomoTotalMinutes += 1/60
      } else {
        completeSession()
      }
    }, 1000)
  } else {
    clearInterval(timer)
  }
}

const completeSession = () => {
  clearInterval(timer)
  isRunning.value = false

  if (currentMode.value === 'focus') {
    store.pomoSessions++
    // 切换到休息
    currentMode.value = store.pomoSessions % 4 === 0 ? 'long' : 'short'
    timeLeft.value = currentMode.value === 'long' ? store.pomoLongBreak * 60 : store.pomoShortBreak * 60
  } else {
    // 切换到专注
    currentMode.value = 'focus'
    timeLeft.value = store.pomoTime * 60
  }
}

const resetTimer = () => {
  clearInterval(timer)
  isRunning.value = false
  currentMode.value = 'focus'
  timeLeft.value = store.pomoTime * 60
}

const skipTimer = () => {
  completeSession()
}
</script>

<style lang="scss" scoped>
.pomodoro-card {
  .pomodoro-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;

    .timer-display {
      display: flex;
      flex-direction: column;
      align-items: center;

      .time {
        font-size: 3rem;
        font-weight: 700;
        @include text-gradient;
        font-family: 'Courier New', monospace;
      }

      .mode {
        font-size: 14px;
        color: $text-light;
        margin-top: 4px;
      }
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 16px;

      .ctrl-btn, .play-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: $bg-card;
        border: 1px solid $border;
        color: $text;
        transition: $transition;

        &:hover {
          border-color: $primary;
          color: $primary;
        }
      }

      .play-btn {
        width: 64px;
        height: 64px;
        background: $gradient-primary;
        border: none;
        color: white;

        &:hover {
          transform: scale(1.1);
          box-shadow: $glow;
        }
      }
    }

    .stats {
      display: flex;
      gap: 40px;

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;

        .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: $primary;
        }

        .label {
          font-size: 12px;
          color: $text-light;
        }
      }
    }
  }
}
</style>
