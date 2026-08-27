<template>
  <div class="widget countdown-widget" v-if="countdownData">
    <div class="widget-header">
      <span class="widget-icon">⏰</span>
      <span class="widget-title">倒计时</span>
    </div>
    <div class="countdown-content">
      <div class="countdown-target">{{ countdownData.name }}</div>
      <div class="countdown-time">
        <div class="time-block" v-if="countdownData.days > 0">
          <span class="time-value">{{ countdownData.days }}</span>
          <span class="time-label">天</span>
        </div>
        <div class="time-block">
          <span class="time-value">{{ countdownData.hours }}</span>
          <span class="time-label">时</span>
        </div>
        <div class="time-block">
          <span class="time-value">{{ countdownData.mins }}</span>
          <span class="time-label">分</span>
        </div>
        <div class="time-block">
          <span class="time-value">{{ countdownData.secs }}</span>
          <span class="time-label">秒</span>
        </div>
      </div>
      <div class="countdown-date">{{ countdownData.formatted }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { mainStore } from '../../store'

const store = mainStore()
const now = ref(Date.now())
let timer = null

// 默认倒计时：距离2027年
const getDefaultCountdown = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  d.setMonth(0)
  d.setDate(1)
  return { date: d.toISOString().split('T')[0], name: '新年倒计时' }
}

const countdownData = computed(() => {
  // 优先从配置获取，否则用默认值
  const configDate = store.config?.site?.countdownDate
  const configName = store.config?.site?.countdownName

  let targetDate, targetName
  if (configDate) {
    targetDate = configDate
    targetName = configName || '目标日期'
  } else {
    const def = getDefaultCountdown()
    targetDate = def.date
    targetName = def.name
  }

  const target = new Date(targetDate).getTime()
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)
  const diff = endOfDay.getTime() - now.value

  if (diff <= 0) {
    return { name: targetName, days: 0, hours: 0, mins: 0, secs: 0, formatted: '已到达！🎉', isDefault: !configDate }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secs = Math.floor((diff % (1000 * 60)) / 1000)

  const d = new Date(targetDate)
  const formatted = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`

  return { name: targetName, days, hours, mins, secs, formatted, isDefault: !configDate }
})

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.countdown-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  min-height: 120px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.15);
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.widget-icon {
  font-size: 16px;
}

.widget-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #00d4ff;
}

.countdown-content {
  text-align: center;
}

.countdown-target {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  font-weight: 500;
}

.countdown-time {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.time-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
  padding: 8px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 8px;
}

.time-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  line-height: 1;
}

.time-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.countdown-date {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 900px) {
  .countdown-time {
    gap: 4px;
  }

  .time-block {
    min-width: 40px;
    padding: 6px 4px;
  }

  .time-value {
    font-size: 1.2rem;
  }
}
</style>
