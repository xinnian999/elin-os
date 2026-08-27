<template>
  <div v-if="enabled">
    <!-- 外圈跟随圆 -->
    <div class="cursor-ring" :style="ringStyle"></div>
    <!-- 内核点 -->
    <div class="cursor-dot" :style="dotStyle"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { mainStore } from '../store'

const store = mainStore()
const enabled = computed(() => store.customCursorEnabled)

const mouse = ref({ x: -100, y: -100 })
const ring = ref({ x: -100, y: -100 })
const isHover = ref(false)
const isClick = ref(false)

let rafId = null

// 平滑跟随
const lerp = (a, b, t) => a + (b - a) * t

const updateRing = () => {
  ring.value.x = lerp(ring.value.x, mouse.value.x, 0.12)
  ring.value.y = lerp(ring.value.y, mouse.value.y, 0.12)
  rafId = requestAnimationFrame(updateRing)
}

const onMouseMove = (e) => {
  mouse.value = { x: e.clientX, y: e.clientY }
}

const onMouseOver = (e) => {
  const el = e.target
  isHover.value = !!(
    el.closest('a') ||
    el.closest('button') ||
    el.closest('.widget') ||
    el.closest('[role="button"]') ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT'
  )
}

const onMouseDown = () => { isClick.value = true }
const onMouseUp = () => { isClick.value = false }

const dotStyle = computed(() => ({
  left: mouse.value.x + 'px',
  top: mouse.value.y + 'px',
  background: store.currentTheme?.primary || '#00d4ff',
  transform: `translate(-50%, -50%) scale(${isClick.value ? 0.5 : 1})`
}))

const ringStyle = computed(() => ({
  left: ring.value.x + 'px',
  top: ring.value.y + 'px',
  width: isHover.value ? '48px' : '32px',
  height: isHover.value ? '48px' : '32px',
  borderColor: store.currentTheme?.primary || '#00d4ff',
  opacity: isHover.value ? 0.8 : 0.5,
  transform: `translate(-50%, -50%) scale(${isClick.value ? 0.8 : 1})`
}))

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseover', onMouseOver)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  updateRing()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseover', onMouseOver)
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mouseup', onMouseUp)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style lang="scss" scoped>
.cursor-dot {
  position: fixed;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 99999;
  transition: transform 0.1s ease, background 0.3s ease;
  mix-blend-mode: screen;
}

.cursor-ring {
  position: fixed;
  border-radius: 50%;
  border: 1.5px solid;
  pointer-events: none;
  z-index: 99998;
  transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease, border-color 0.3s ease, transform 0.1s ease;
}
</style>
