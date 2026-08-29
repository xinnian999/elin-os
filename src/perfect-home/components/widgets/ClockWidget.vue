<template>
  <div
    class="clock-widget"
    :class="{ flipped: isFlipped }"
    role="button"
    tabindex="0"
    :aria-label="flipActionLabel"
    :aria-pressed="isFlipped"
    @click="toggleFace"
    @keydown="handleKeydown"
  >
    <section
      class="face face-front"
      :aria-hidden="isFlipped"
      :inert="isFlipped"
    >
      <div class="card-inner">
        <div class="header">
          <span class="icon">🕐</span>
          <span class="title">{{ t('clock') }}</span>
          <span class="flip-indicator" aria-hidden="true">{{ t('flip') }} ↻</span>
        </div>

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
    </section>

    <section
      class="face face-back"
      :aria-hidden="!isFlipped"
      :inert="!isFlipped"
    >
      <div class="card-inner calendar-card">
        <div class="header">
          <span class="icon">📅</span>
          <span class="title">{{ t('calendar') }}</span>
          <span class="flip-indicator" aria-hidden="true">{{ t('back') }} ↺</span>
        </div>

        <div class="calendar-month">{{ calendarMonthLabel }}</div>
        <div class="calendar-grid">
          <span
            v-for="weekday in weekdays"
            :key="weekday"
            class="calendar-weekday"
          >{{ weekday }}</span>
          <span
            v-for="cell in calendarCells"
            :key="cell.dateKey"
            class="calendar-day"
            :class="{
              outside: !cell.currentMonth,
              weekend: cell.weekend,
              today: cell.today,
            }"
            :aria-current="cell.today ? 'date' : undefined"
          >{{ cell.day }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { mainStore } from '../../store'
import { createCalendarGrid } from '../../utils/calendar-grid'

const store = mainStore()
const isFlipped = ref(false)
const lang = computed(() => store.language || 'zh')

const translations = {
  zh: { clock: '时间', calendar: '日历', flip: '翻转', back: '返回', viewClock: '返回时间', viewCalendar: '翻转查看日历' },
  en: { clock: 'Clock', calendar: 'Calendar', flip: 'Flip', back: 'Back', viewClock: 'Back to clock', viewCalendar: 'Flip to calendar' },
}
const t = key => translations[lang.value]?.[key] || translations.zh[key]
const locale = computed(() => (lang.value === 'en' ? 'en-US' : 'zh-CN'))

const timeDigits = computed(() => {
  const time = store.timeStr || '00:00:00'
  const [hours = '00', minutes = '00', seconds = '00'] = time.split(':')
  return {
    hour0: hours[0],
    hour1: hours[1],
    min0: minutes[0],
    min1: minutes[1],
    sec0: seconds[0],
    sec1: seconds[1],
  }
})

const ledDigits = {
  0: [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  1: [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  2: [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  3: [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  4: [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  5: [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  6: [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  7: [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
  8: [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  9: [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
}

const calendarDateKey = computed(() => {
  const date = store.now
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
})

const calendarDate = computed(() => new Date(`${calendarDateKey.value}T00:00:00`))

const formattedDate = computed(() => new Intl.DateTimeFormat(locale.value, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(calendarDate.value))

const calendarMonthLabel = computed(() => new Intl.DateTimeFormat(locale.value, {
  year: 'numeric',
  month: 'long',
}).format(calendarDate.value))

const weekdays = computed(() => (
  lang.value === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['一', '二', '三', '四', '五', '六', '日']
))

const calendarCells = computed(() => createCalendarGrid(calendarDate.value))

const flipActionLabel = computed(() => (
  isFlipped.value ? t('viewClock') : `${t('viewCalendar')}：${calendarMonthLabel.value}`
))

const toggleFace = () => {
  isFlipped.value = !isFlipped.value
}

const handleKeydown = (event) => {
  if (!['Enter', ' '].includes(event.key)) return
  event.preventDefault()
  toggleFace()
}
</script>

<style lang="scss" scoped>
.clock-widget {
  position: relative;
  display: grid;
  grid-template-areas: 'clock-face';
  min-height: 160px;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  perspective: 1000px;
  cursor: pointer;
  transition:
    transform 0.2s ease-out,
    border-color 0.2s ease-out,
    box-shadow 0.2s ease-out;

  &:hover {
    border-color: rgba(0, 212, 255, 0.5);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-primary, #00d4ff);
    outline-offset: 3px;
  }
}

.face {
  grid-area: clock-face;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 160px;
  box-sizing: border-box;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform 0.28s cubic-bezier(0.65, 0, 0.35, 1);
}

.face-front {
  z-index: 2;
  transform: rotateY(0deg);
}

.face-back {
  background: rgba(0, 212, 255, 0.08);
  transform: rotateY(180deg);
}

.flipped {
  .face-front { transform: rotateY(-180deg); }
  .face-back { transform: rotateY(0deg); }
}

.card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 160px;
  padding: 12px;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-bottom: 8px;

  .icon { font-size: 14px; }
  .title {
    color: #00d4ff;
    font-size: 0.75rem;
    font-weight: 600;
  }
}

.flip-indicator {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.58rem;
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
  margin: 0 3px;
  color: #00d4ff;
  font-size: 1.2rem;
  font-weight: 700;
}

.led-row {
  display: flex;
  gap: 2px;
}

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
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
  text-align: center;
}

.greeting {
  margin-top: 6px;
  color: var(--theme-primary);
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  text-shadow: 0 0 10px var(--theme-glow);
}

.calendar-card {
  align-items: stretch;

  .header { margin-bottom: 3px; }
}

.calendar-month {
  margin-bottom: 3px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.68rem;
  font-weight: 600;
  text-align: center;
}

.calendar-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  align-content: space-between;
  align-items: center;
  gap: 1px 2px;
  min-height: 0;
}

.calendar-weekday {
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.56rem;
  font-weight: 600;
  line-height: 1;
  text-align: center;
}

.calendar-day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.82);
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  line-height: 1;
}

.calendar-day.outside {
  color: rgba(255, 255, 255, 0.2);
}

.calendar-day.weekend:not(.outside, .today) {
  color: rgba(255, 214, 141, 0.72);
}

.calendar-day.today {
  color: #041017;
  font-weight: 800;
  background: var(--theme-primary, #00d4ff);
  box-shadow: 0 0 8px var(--theme-glow, rgba(0, 212, 255, 0.6));
}

@media (prefers-reduced-motion: reduce) {
  .clock-widget,
  .face {
    transition: none;
  }
}

@media (min-width: 901px) {
  .card-inner {
    height: 100%;
  }

  .face-front .led-time {
    margin-top: auto;
  }

  .face-front .greeting {
    margin-bottom: auto;
  }
}
</style>
