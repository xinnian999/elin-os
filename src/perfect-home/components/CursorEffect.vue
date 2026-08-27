<template>
  <div class="cursor-effect" ref="cursor" :style="{ left: x + 'px', top: y + 'px' }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const cursor = ref(null)
const x = ref(-100)
const y = ref(-100)

const moveCursor = (e) => {
  x.value = e.clientX
  y.value = e.clientY
}

onMounted(() => {
  document.addEventListener('mousemove', moveCursor)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', moveCursor)
})
</script>

<style lang="scss" scoped>
.cursor-effect {
  position: fixed;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: left 0.1s ease-out, top 0.1s ease-out;
  mix-blend-mode: screen;

  @media (max-width: $mobile) {
    display: none;
  }
}
</style>
