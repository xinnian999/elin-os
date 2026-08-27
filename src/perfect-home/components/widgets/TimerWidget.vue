<template>
  <div class="widget timer-widget" @click="store.setOpenState = true" title="点击打开设置">
    <div class="timer-content">
      <span class="timer-icon">⏱️</span>
      <div class="timer-inline">
        <span class="timer-value">{{ days }}</span>
        <span class="timer-unit">天</span>
        <span class="timer-value">{{ hours }}</span>
        <span class="timer-unit">:</span>
        <span class="timer-value">{{ mins }}</span>
        <span class="timer-unit">:</span>
        <span class="timer-value">{{ secs }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { mainStore } from '../../store'

const store = mainStore()
const now = ref(Date.now())
let timer = null

const timeDiff = computed(() => {
  if (!store.siteStartDate) return 0
  return now.value - new Date(store.siteStartDate).getTime()
})

const days = computed(() => {
  const d = Math.floor(timeDiff.value / (1000 * 60 * 60 * 24))
  return d > 0 ? d : 0
})

const hours = computed(() => {
  const h = Math.floor((timeDiff.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return String(h).padStart(2, '0')
})

const mins = computed(() => {
  const m = Math.floor((timeDiff.value % (1000 * 60 * 60)) / (1000 * 60))
  return String(m).padStart(2, '0')
})

const secs = computed(() => {
  const s = Math.floor((timeDiff.value % (1000 * 60)) / 1000)
  return String(s).padStart(2, '0')
})

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.timer-widget {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: fit-content;

  &:hover {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
  }
}

.timer-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.timer-icon {
  font-size: 12px;
  opacity: 0.6;
}

.timer-inline {
  display: flex;
  align-items: center;
  gap: 2px;
}

.timer-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'JetBrains Mono', monospace;
}

.timer-unit {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.4);
}
</style>
