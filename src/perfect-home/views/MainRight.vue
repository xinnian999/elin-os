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
          :aria-hidden="isDesktopPagination ? activePage !== pageIndex : undefined"
          :inert="isDesktopPagination ? activePage !== pageIndex : undefined"
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
          :aria-hidden="isDesktopPagination ? activePage !== widgetPages.length : undefined"
          :inert="isDesktopPagination ? activePage !== widgetPages.length : undefined"
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
import MusicWidget from '../components/widgets/MusicWidget.vue'
import CountdownWidget from '../components/widgets/CountdownWidget.vue'
import WoodenFishWidget from '../components/widgets/WoodenFishWidget.vue'
import TodoWidget from '../components/widgets/TodoWidget.vue'
import QuickNotesWidget from '../components/widgets/QuickNotesWidget.vue'
import PomodoroWidget from '../components/widgets/PomodoroWidget.vue'
import GithubContribWidget from '../components/widgets/GithubContribWidget.vue'
import LinksWidget from '../components/widgets/LinksWidget.vue'
import {
  createWheelAxisLock,
  createWheelPageGesture,
  WHEEL_PAGE_TRANSITION_LOCK_MS,
} from '../utils/wheel-page-gesture'

const WIDGETS_PER_PAGE = 6
const dashboardWidgets = [
  { id: 'clock', component: ClockWidget },
  { id: 'weather', component: WeatherWidget },
  { id: 'visitor', component: VisitorWidget },
  { id: 'wooden-fish', component: WoodenFishWidget },
  { id: 'music', component: MusicWidget },
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
const isDesktopPagination = ref(window.innerWidth > 900)
const touchStartX = ref(0)
const touchStartY = ref(0)
const wheelTransitionLockMs = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? 0
  : WHEEL_PAGE_TRANSITION_LOCK_MS
const wheelAxisLock = createWheelAxisLock({ horizontalOnly: true })
const wheelPageGesture = createWheelPageGesture({ transitionLockMs: wheelTransitionLockMs })
let wheelUnlockTimer = null

const goToPage = (page) => {
  activePage.value = Math.max(0, Math.min(pageCount - 1, page))
}

const changePage = (direction) => {
  const nextPage = Math.max(0, Math.min(pageCount - 1, activePage.value + direction))
  if (nextPage === activePage.value) return false
  activePage.value = nextPage
  return true
}

const applyWheelPageChange = (direction, now = performance.now()) => {
  const applied = changePage(direction)
  wheelPageGesture.commit(applied, now)
  if (!applied || wheelTransitionLockMs === 0) return

  if (wheelUnlockTimer) window.clearTimeout(wheelUnlockTimer)
  wheelUnlockTimer = window.setTimeout(() => {
    wheelUnlockTimer = null
    const queuedDirection = wheelPageGesture.unlock(performance.now())
    if (queuedDirection) applyWheelPageChange(queuedDirection)
  }, wheelTransitionLockMs)
}

const handleWheel = (event) => {
  if (window.innerWidth <= 900) return
  const now = performance.now()
  const delta = wheelAxisLock.pick(event.deltaX, event.deltaY, now)
  if (Math.abs(delta) < 1) return
  event.preventDefault()
  const direction = wheelPageGesture.push(delta, now)
  if (direction) applyWheelPageChange(direction, now)
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
  if (target instanceof Element && target.closest('.project-backdrop, .config-editor-overlay, .settings-panel')) return
  handleWheel(event)
}

const handleKeydown = (event) => {
  if (window.innerWidth <= 900) return
  const target = event.target
  if (target instanceof Element && target.closest('button, input, select, textarea, a, [contenteditable="true"], [role="slider"]')) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    changePage(1)
  }
  if (event.key === 'ArrowLeft') {
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

const syncPaginationMode = () => {
  isDesktopPagination.value = window.innerWidth > 900
}

onMounted(() => {
  syncPaginationMode()
  window.addEventListener('resize', syncPaginationMode)
  window.addEventListener('wheel', handleWindowWheel, { passive: false, capture: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', syncPaginationMode)
  window.removeEventListener('wheel', handleWindowWheel, { capture: true })
  if (wheelUnlockTimer) window.clearTimeout(wheelUnlockTimer)
  wheelAxisLock.reset()
  wheelPageGesture.reset()
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
  overflow-x: clip;
  overflow-y: visible;
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
  padding: 0 12px 12px;
  overflow-x: clip;
  overflow-y: visible;
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
