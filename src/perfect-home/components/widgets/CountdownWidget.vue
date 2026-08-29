<template>
  <div
    v-if="countdownData && holidayData"
    class="widget countdown-widget"
    :class="{ flipped: isFlipped }"
    role="button"
    tabindex="0"
    :aria-label="flipActionLabel"
    :aria-pressed="isFlipped"
    @click="toggleCountdown"
    @keydown="handleKeydown"
  >
    <div class="countdown-card">
      <section
        class="countdown-face countdown-front"
        :aria-hidden="isFlipped"
        :inert="isFlipped"
      >
        <div class="widget-header">
          <span class="widget-icon">🏖️</span>
          <span class="widget-title holiday-title">倒计时</span>
          <span class="flip-indicator" aria-hidden="true">翻转 ↻</span>
        </div>
        <div class="countdown-content">
          <div class="countdown-target holiday-target">{{ holidayData.name }}</div>
          <div v-if="holidayData.active" class="holiday-active">
            <span class="holiday-active-icon" aria-hidden="true">🎉</span>
            <strong>假期进行中</strong>
          </div>
          <div v-else class="countdown-time">
            <div v-for="unit in holidayUnits" :key="unit.label" class="time-block holiday-time-block">
              <span class="time-value">{{ unit.value }}</span>
              <span class="time-label">{{ unit.label }}</span>
            </div>
          </div>
          <div class="countdown-date holiday-date">{{ holidayData.formatted }}</div>
        </div>
      </section>

      <section
        class="countdown-face countdown-back"
        :aria-hidden="!isFlipped"
        :inert="!isFlipped"
      >
        <div class="widget-header">
          <span class="widget-icon">⏰</span>
          <span class="widget-title">倒计时</span>
          <span class="flip-indicator" aria-hidden="true">返回 ↺</span>
        </div>
        <div class="countdown-content">
          <div class="countdown-target" :title="countdownData.name">{{ countdownData.name }}</div>
          <div class="countdown-time">
            <div v-for="unit in countdownUnits" :key="unit.label" class="time-block">
              <span class="time-value">{{ unit.value }}</span>
              <span class="time-label">{{ unit.label }}</span>
            </div>
          </div>
          <div class="countdown-date">{{ countdownData.formatted }}</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { mainStore } from '../../store'
import {
  createCountdownData,
  formatChineseDate,
  getNextLegalHoliday,
} from '../../utils/holiday-countdown'

const store = mainStore()
const now = ref(Date.now())
const isFlipped = ref(false)
const chinaYearFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
})
let timer = null

const getDefaultCountdown = () => {
  const year = Number(chinaYearFormatter.format(new Date(now.value))) + 1
  return { date: `${year}-01-01`, name: '新年倒计时' }
}

const countdownData = computed(() => {
  const configuredDate = store.config?.site?.countdownDate
  const configuredName = store.config?.site?.countdownName
  const fallback = getDefaultCountdown()
  const targetDate = configuredDate || fallback.date
  const targetName = configuredName || (configuredDate ? '目标日期' : fallback.name)
  const countdown = createCountdownData(targetDate, now.value, { endOfDay: true })

  if (!countdown && configuredDate) {
    const fallbackCountdown = createCountdownData(fallback.date, now.value, { endOfDay: true })
    return {
      ...fallbackCountdown,
      name: fallback.name,
      formatted: fallbackCountdown.reached ? '已到达！🎉' : fallbackCountdown.formatted,
    }
  }
  if (!countdown) return null
  return {
    ...countdown,
    name: targetName,
    formatted: countdown.reached ? '已到达！🎉' : countdown.formatted,
  }
})

const holidayData = computed(() => {
  const holiday = getNextLegalHoliday(now.value)
  if (!holiday) return null
  if (holiday.active) {
    const endDate = formatChineseDate(holiday.endDate)
    return {
      name: `${holiday.name}假期`,
      active: true,
      days: 0,
      hours: 0,
      mins: 0,
      secs: 0,
      formatted: holiday.endDate === holiday.date ? '今天是法定节日' : `假期至 ${endDate}`,
    }
  }

  const countdown = createCountdownData(holiday.date, now.value)
  return {
    ...countdown,
    name: `距${holiday.name}还有`,
    active: false,
    formatted: holiday.official
      ? countdown.formatted
      : `${countdown.formatted} · 法定节日`,
  }
})

const getUnits = data => [
  { label: '天', value: data.days, visible: data.days > 0 },
  { label: '时', value: data.hours, visible: true },
  { label: '分', value: data.mins, visible: true },
  { label: '秒', value: data.secs, visible: true },
].filter(unit => unit.visible)

const countdownUnits = computed(() => getUnits(countdownData.value))
const holidayUnits = computed(() => getUnits(holidayData.value))
const flipActionLabel = computed(() => (
  isFlipped.value
    ? `返回${holidayData.value.name}`
    : `查看${countdownData.value.name}`
))

const toggleCountdown = () => {
  isFlipped.value = !isFlipped.value
}

const handleKeydown = (event) => {
  if (!['Enter', ' '].includes(event.key)) return
  event.preventDefault()
  toggleCountdown()
}

onMounted(() => {
  timer = window.setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.countdown-widget {
  position: relative;
  min-height: 160px;
  padding: 0;
  background: transparent;
  border: 0;
  perspective: 1000px;
  cursor: pointer;
  outline: none;
  overflow: visible;
  transition: transform 0.2s ease-out;

  &:hover {
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-primary, #00d4ff);
    outline-offset: 3px;
    border-radius: 16px;
  }
}

.countdown-card {
  display: grid;
  grid-template-areas: 'countdown-face';
  width: 100%;
  height: 100%;
  min-height: 160px;
  transform-style: preserve-3d;
  transition: transform 0.28s cubic-bezier(0.65, 0, 0.35, 1);
}

.countdown-widget.flipped .countdown-card {
  transform: rotateY(180deg);
}

.countdown-face {
  grid-area: countdown-face;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 160px;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out;
}

.countdown-widget:hover .countdown-face {
  border-color: rgba(0, 212, 255, 0.32);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.14);
}

.countdown-front {
  transform: rotateY(0deg);
}

.countdown-back {
  border-color: rgba(255, 196, 92, 0.28);
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 196, 92, 0.13), transparent 42%),
    rgba(15, 20, 34, 0.92);
  transform: rotateY(180deg);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-bottom: 6px;
}

.widget-icon {
  font-size: 16px;
}

.widget-title {
  min-width: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #00d4ff;
}

.holiday-title {
  color: #ffd27a;
}

.flip-indicator {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.58rem;
}

.countdown-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  text-align: center;
}

.countdown-target {
  overflow: hidden;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.9rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.holiday-target {
  color: rgba(255, 236, 196, 0.94);
}

.countdown-time {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 5px;
}

.time-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 46px;
  padding: 6px;
  border-radius: 8px;
  background: rgba(0, 212, 255, 0.1);
}

.holiday-time-block {
  border: 1px solid rgba(255, 196, 92, 0.12);
  background: rgba(255, 196, 92, 0.09);
}

.time-value {
  color: #fff;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1;
}

.time-label {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.65rem;
}

.countdown-date {
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.7rem;
}

.holiday-date {
  color: rgba(255, 224, 163, 0.58);
}

.holiday-active {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 57px;
  margin-bottom: 7px;
  color: #ffe2a3;
  font-size: 1rem;
}

.holiday-active-icon {
  font-size: 1.3rem;
}

@media (prefers-reduced-motion: reduce) {
  .countdown-widget,
  .countdown-card,
  .countdown-face {
    transition: none;
  }
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
