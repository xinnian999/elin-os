<template>
  <div
    ref="rightPanel"
    class="right"
    tabindex="0"
    aria-label="桌面卡片分页"
    @keydown="handleKeydown"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="page-viewport">
      <div class="page-track" :style="{ transform: `translate3d(-${activePage * 100}%, 0, 0)` }">
        <section
          v-for="(widgets, pageIndex) in widgetPages"
          :key="`widgets-${pageIndex}`"
          class="desktop-page"
          :aria-hidden="activePage !== pageIndex"
          :inert="activePage !== pageIndex"
        >
          <div class="dashboard-grid" :style="{ '--dashboard-row-count': Math.ceil(widgets.length / 2) }">
            <component
              :is="widget.component"
              v-for="widget in widgets"
              :key="widget.id"
            />
          </div>
        </section>

        <section
          class="desktop-page desktop-page--works"
          :aria-hidden="activePage !== widgetPages.length"
          :inert="activePage !== widgetPages.length"
        >
          <LinksWidget desktop />
        </section>
      </div>
    </div>

    <nav class="page-indicator" aria-label="右侧桌面分页">
      <button
        v-for="page in pageCount"
        :key="page"
        type="button"
        class="page-dot"
        :class="{ active: activePage === page - 1 }"
        :aria-label="`切换到第 ${page} 页`"
        :aria-current="activePage === page - 1 ? 'page' : undefined"
        @click="goToPage(page - 1)"
      />
    </nav>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import ClockWidget from '../components/widgets/ClockWidget.vue'
import WeatherWidget from '../components/widgets/WeatherWidget.vue'
import VisitorWidget from '../components/widgets/VisitorWidget.vue'
import HitokotoWidget from '../components/widgets/HitokotoWidget.vue'
import CountdownWidget from '../components/widgets/CountdownWidget.vue'
import WoodenFishWidget from '../components/widgets/WoodenFishWidget.vue'
import TodoWidget from '../components/widgets/TodoWidget.vue'
import QuickNotesWidget from '../components/widgets/QuickNotesWidget.vue'
import PomodoroWidget from '../components/widgets/PomodoroWidget.vue'
import GithubContribWidget from '../components/widgets/GithubContribWidget.vue'
import LinksWidget from '../components/widgets/LinksWidget.vue'

const WIDGETS_PER_PAGE = 6
const dashboardWidgets = [
  { id: 'clock', component: ClockWidget },
  { id: 'weather', component: WeatherWidget },
  { id: 'visitor', component: VisitorWidget },
  { id: 'wooden-fish', component: WoodenFishWidget },
  { id: 'hitokoto', component: HitokotoWidget },
  { id: 'countdown', component: CountdownWidget },
  { id: 'pomodoro', component: PomodoroWidget },
  { id: 'quick-notes', component: QuickNotesWidget },
  { id: 'todo', component: TodoWidget },
  { id: 'github-contrib', component: GithubContribWidget },
]
const widgetPages = Array.from(
  { length: Math.ceil(dashboardWidgets.length / WIDGETS_PER_PAGE) },
  (_, pageIndex) => dashboardWidgets.slice(pageIndex * WIDGETS_PER_PAGE, (pageIndex + 1) * WIDGETS_PER_PAGE),
)
const pageCount = widgetPages.length + 1
const rightPanel = ref(null)
const activePage = ref(0)
const touchStartX = ref(0)
const touchStartY = ref(0)
let wheelGestureHandled = false
let wheelGestureDelta = 0
let wheelTimer = null
let lastWheelEventAt = 0
let lastWheelPageAt = 0
let lastWheelMagnitude = 0
let lastWheelDirection = 0
let wheelGesturePeak = 0
let wheelTailHasDecayed = false
let wheelRiseStreak = 0
let wheelRiseGain = 0

const resetWheelGesture = () => {
  wheelGestureHandled = false
  wheelGestureDelta = 0
  wheelTimer = null
  lastWheelEventAt = 0
  lastWheelMagnitude = 0
  lastWheelDirection = 0
  wheelGesturePeak = 0
  wheelTailHasDecayed = false
  wheelRiseStreak = 0
  wheelRiseGain = 0
}

const goToPage = (page) => {
  activePage.value = Math.max(0, Math.min(pageCount - 1, page))
}

const changePage = (direction) => {
  const nextPage = Math.max(0, Math.min(pageCount - 1, activePage.value + direction))
  if (nextPage === activePage.value) return
  activePage.value = nextPage
}

const handleWheel = (event) => {
  if (window.innerWidth <= 900) return
  const delta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  if (Math.abs(delta) < 1) return
  event.preventDefault()
  const now = performance.now()
  const magnitude = Math.abs(delta)
  const direction = Math.sign(delta)
  const eventGap = now - lastWheelEventAt
  const sincePageChange = now - lastWheelPageAt
  const magnitudeRise = magnitude - lastWheelMagnitude

  if (wheelGestureHandled) {
    wheelGesturePeak = Math.max(wheelGesturePeak, magnitude)
    if (magnitude <= wheelGesturePeak * 0.72) wheelTailHasDecayed = true

    const meaningfulRise = magnitudeRise >= Math.max(1.2, lastWheelMagnitude * 0.12)
    if (wheelTailHasDecayed && meaningfulRise) {
      wheelRiseStreak += 1
      wheelRiseGain += magnitudeRise
    } else if (magnitudeRise <= 0) {
      wheelRiseStreak = 0
      wheelRiseGain = 0
    }
  }

  const renewedBurst = wheelGestureHandled
    && wheelTailHasDecayed
    && sincePageChange > 100
    && (
      magnitudeRise >= Math.max(4, lastWheelMagnitude * 0.35)
      || (wheelRiseStreak >= 2 && wheelRiseGain >= Math.max(4, wheelGesturePeak * 0.2))
    )
  const reversedBurst = wheelGestureHandled
    && sincePageChange > 90
    && direction !== lastWheelDirection
    && magnitude >= 6

  if (eventGap > 90 || renewedBurst || reversedBurst) {
    wheelGestureHandled = false
    wheelGestureDelta = 0
    wheelGesturePeak = 0
    wheelTailHasDecayed = false
    wheelRiseStreak = 0
    wheelRiseGain = 0
  }

  lastWheelEventAt = now
  lastWheelMagnitude = magnitude
  lastWheelDirection = direction
  if (wheelTimer) window.clearTimeout(wheelTimer)
  wheelTimer = window.setTimeout(resetWheelGesture, 90)
  wheelGestureDelta += delta
  if (wheelGestureHandled) return
  if (Math.abs(wheelGestureDelta) < 18) return
  wheelGestureHandled = true
  lastWheelPageAt = now
  wheelGesturePeak = magnitude
  wheelTailHasDecayed = false
  wheelRiseStreak = 0
  wheelRiseGain = 0
  changePage(wheelGestureDelta > 0 ? 1 : -1)
}

const handleWindowWheel = (event) => {
  if (window.innerWidth <= 900 || !rightPanel.value) return
  const rect = rightPanel.value.getBoundingClientRect()
  const insideRightPanel = event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom
  if (!insideRightPanel) return

  const target = event.target
  if (target instanceof Element && target.closest('.project-backdrop, .config-editor-overlay, .settings-panel, .music-panel')) return
  handleWheel(event)
}

const handleKeydown = (event) => {
  if (window.innerWidth <= 900) return
  if (['ArrowDown', 'PageDown', 'ArrowRight'].includes(event.key)) {
    event.preventDefault()
    changePage(1)
  }
  if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(event.key)) {
    event.preventDefault()
    changePage(-1)
  }
}

const handleTouchStart = (event) => {
  const touch = event.changedTouches[0]
  touchStartX.value = touch?.clientX || 0
  touchStartY.value = touch?.clientY || 0
}

const handleTouchEnd = (event) => {
  if (window.innerWidth <= 900) return
  const touch = event.changedTouches[0]
  const distanceX = touchStartX.value - (touch?.clientX || 0)
  const distanceY = touchStartY.value - (touch?.clientY || 0)
  if (Math.abs(distanceX) > 42 && Math.abs(distanceX) > Math.abs(distanceY)) {
    changePage(distanceX > 0 ? 1 : -1)
  }
}

onMounted(() => {
  window.addEventListener('wheel', handleWindowWheel, { passive: false, capture: true })
})

onUnmounted(() => {
  window.removeEventListener('wheel', handleWindowWheel, { capture: true })
  if (wheelTimer) window.clearTimeout(wheelTimer)
  resetWheelGesture()
})
</script>

<style lang="scss" scoped>
.right {
  width: 50%;
  height: 100%;
  min-height: 0;
  position: relative;
  padding: 0;
  outline: none;

  @media (max-width: 900px) {
    width: 100%;
    height: auto;
  }
}

.page-viewport {
  width: 100%;
  height: calc(100% - 32px);
  min-height: 0;
  overflow: hidden;
}

.page-track {
  width: 100%;
  height: 100%;
  display: flex;
  transition: transform 0.62s cubic-bezier(.22, .78, .2, 1);
  will-change: transform;
}

.desktop-page {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}

.desktop-page--works {
  padding: 2px;
}

.dashboard-grid {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(var(--dashboard-row-count), minmax(0, 1fr));
  gap: 14px;
}

.dashboard-grid :deep(.widget) {
  height: 100%;
  min-height: 0;
}

.page-indicator {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding-top: 4px;
}

.page-dot {
  position: relative;
  flex: 0 0 30px;
  width: 30px;
  height: 24px;
  padding: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.page-dot::before {
  content: '';
  position: absolute;
  inset: 50% 0 auto;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .22);
  transform: translateY(-50%);
  transition: background .3s ease, box-shadow .3s ease;
}

.page-dot:hover::before,
.page-dot:focus-visible::before {
  background: rgba(255, 255, 255, .52);
}

.page-dot:focus-visible {
  outline: 1px solid var(--theme-primary);
  outline-offset: 4px;
}

.page-dot.active::before {
  background: var(--theme-primary);
  box-shadow: 0 0 12px var(--theme-glow);
}

@media (prefers-reduced-motion: reduce) {
  .page-track { transition: none; }
}

@media (max-width: 900px) {
  .page-viewport {
    height: auto;
    overflow: visible;
  }

  .page-track {
    display: block;
    height: auto;
    transform: none !important;
  }

  .desktop-page {
    width: 100%;
    height: auto;
    padding: 0;
    overflow: visible;
  }

  .desktop-page + .desktop-page { margin-top: 16px; }

  .dashboard-grid {
    height: auto;
    grid-template-rows: none;
    gap: 16px;
  }

  .dashboard-grid :deep(.widget) {
    height: auto;
  }

  .page-indicator { display: none; }

  @media (max-width: 480px) {
    .dashboard-grid { grid-template-columns: 1fr; }
  }
}
</style>
