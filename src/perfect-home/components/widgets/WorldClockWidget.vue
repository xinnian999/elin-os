<template>
  <div class="widget world-clock-widget">
    <div class="widget-header">
      <span class="widget-icon">🌍</span>
      <span class="widget-title">世界时钟</span>
    </div>
    <div class="clock-list">
      <div class="clock-item" v-for="clock in clocks" :key="clock.timezone">
        <span class="clock-city">{{ clock.city }}</span>
        <span class="clock-time">{{ clock.time }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const now = ref(Date.now())
let timer = null

// 默认时区列表
const defaultTimezones = [
  { city: '北京', timezone: 'Asia/Shanghai', flag: '🇨🇳' },
  { city: '东京', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { city: '洛杉矶', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
  { city: '伦敦', timezone: 'Europe/London', flag: '🇬🇧' }
]

const clocks = computed(() => {
  return defaultTimezones.map(tz => {
    const date = new Date(now.value)
    const options = {
      timeZone: tz.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }
    const time = date.toLocaleTimeString('zh-CN', options)
    return { ...tz, time }
  })
})

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.world-clock-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px var(--theme-glow);
    border-color: var(--theme-primary);
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.widget-icon { font-size: 16px; }

.widget-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--theme-primary);
}

.clock-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}

.clock-city {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.clock-time {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}
</style>
