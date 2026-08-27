<template>
  <div class="widget pomo-widget">
    <div class="widget-header">
      <span class="widget-icon">🍅</span>
      <span class="widget-title">番茄钟</span>
      <div class="pomo-modes">
        <button
          v-for="m in modes"
          :key="m.value"
          :class="{ active: store.pomoDuration === m.value }"
          @click="store.setPomoDuration(m.value)"
        >
          {{ m.label }}
        </button>
      </div>
    </div>

    <div class="pomo-content">
      <div class="pomo-timer">
        <svg class="timer-ring" viewBox="0 0 100 100">
          <circle class="ring-bg" cx="50" cy="50" r="42" />
          <circle
            class="ring-progress"
            cx="50" cy="50" r="42"
            :stroke-dasharray="264"
            :stroke-dashoffset="264 - (264 * progress)"
          />
        </svg>
        <div class="timer-display">
          <div class="timer-text">{{ formattedTime }}</div>
          <div class="timer-mode">{{ store.pomoRunning ? '专注中...' : '准备开始' }}</div>
        </div>
      </div>

      <div class="pomo-controls">
        <button class="reset-btn" @click="store.resetPomo" title="重置">
          🔄
        </button>
        <button class="play-btn" @click="togglePomo">
          {{ store.pomoRunning ? '⏸' : '▶' }}
        </button>
      </div>

      <div class="pomo-stats">
        <span>今日完成: {{ todayCompleted }} 个番茄</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { mainStore } from '../../store'

const store = mainStore()

const modes = [
  { label: '25分', value: 25 },
  { label: '15分', value: 15 },
  { label: '5分', value: 5 }
]

const togglePomo = () => {
  if (store.pomoRunning) {
    store.stopPomo()
  } else {
    store.startPomo()
  }
}

const formattedTime = computed(() => {
  const mins = Math.floor(store.pomoTime / 60)
  const secs = store.pomoTime % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const progress = computed(() => {
  const total = store.pomoDuration * 60
  return (total - store.pomoTime) / total
})

const todayCompleted = computed(() => {
  const today = new Date().toLocaleDateString()
  return store.pomoStats[today] || 0
})
</script>

<style lang="scss" scoped>
.pomo-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  min-height: 140px;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(0, 212, 255, 0.3);
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.widget-icon {
  font-size: 16px;
}

.widget-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #00d4ff;
}

.pomo-modes {
  display: flex;
  gap: 4px;
  margin-left: auto;

  button {
    padding: 4px 8px;
    font-size: 0.65rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(0, 212, 255, 0.1);
    }

    &.active {
      background: rgba(0, 212, 255, 0.2);
      border-color: #00d4ff;
      color: #00d4ff;
    }
  }
}

.pomo-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pomo-timer {
  position: relative;
  width: 90px;
  height: 90px;
}

.timer-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 6;
}

.ring-progress {
  fill: none;
  stroke: url(#gradient);
  stroke: #00d4ff;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s;
}

.timer-display {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  font-family: 'HarmonyOS Sans', monospace;
}

.timer-mode {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

.pomo-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.reset-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

.play-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff, #7b2ff7);
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
  }
}

.pomo-stats {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}
</style>
