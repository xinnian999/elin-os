<template>
  <div class="background">
    <div class="bg-image" :style="{ backgroundImage: `url(${store.currentBg})` }"></div>
    <div class="bg-overlay"></div>
    <canvas ref="canvas" class="particles" v-show="store.particlesEnabled"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { mainStore } from '../store'

const store = mainStore()
const canvas = ref(null)
let ctx = null
let particles = []
let animationId = null
let bgSwitchTimer = null

const initParticles = () => {
  const cvs = canvas.value
  if (!cvs) return
  ctx = cvs.getContext('2d')
  cvs.width = window.innerWidth
  cvs.height = window.innerHeight
  particles = []
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * cvs.width,
      y: Math.random() * cvs.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      color: `rgba(0, 212, 255, ${Math.random() * 0.5 + 0.2})`
    })
  }
  animate()
}

const stopParticles = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (ctx && canvas.value) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  }
}

// 监听粒子开关
watch(() => store.particlesEnabled, (val) => {
  if (val) {
    initParticles()
  } else {
    stopParticles()
  }
})

const animate = () => {
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  particles.forEach(p => {
    p.x += p.vx
    p.y += p.vy

    if (p.x < 0) p.x = canvas.value.width
    if (p.x > canvas.value.width) p.x = 0
    if (p.y < 0) p.y = canvas.value.height
    if (p.y > canvas.value.height) p.y = 0

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.fill()
  })

  // 连线
  particles.forEach((p1, i) => {
    particles.slice(i + 1).forEach(p2 => {
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y)
      if (d < 150) {
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - d / 150)})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    })
  })

  // 鼠标交互
  const mx = store.mouseX
  const my = store.mouseY
  particles.forEach(p => {
    const d = Math.hypot(p.x - mx, p.y - my)
    if (d < 100) {
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(mx, my)
      ctx.strokeStyle = `rgba(255, 0, 137, ${0.2 * (1 - d / 100)})`
      ctx.stroke()
    }
  })

  animationId = requestAnimationFrame(animate)
}

// 自动切换背景
const startAutoSwitch = () => {
  // 每30秒自动切换一次背景
  bgSwitchTimer = setInterval(() => {
    store.nextBg()
  }, 30000)
}

onMounted(() => {
  if (store.particlesEnabled) {
    initParticles()
  }
  store.initWallpapers()

  // 启动自动切换
  startAutoSwitch()

  setTimeout(() => {
    store.setImgLoadStatus(true)
  }, 1500)

  window.addEventListener('resize', () => {
    if (canvas.value) {
      canvas.value.width = window.innerWidth
      canvas.value.height = window.innerHeight
    }
  })
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (bgSwitchTimer) clearInterval(bgSwitchTimer)
})
</script>

<style lang="scss" scoped>
.background {
  position: fixed;
  inset: 0;
  z-index: -1;
}

.bg-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease-in-out;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.45) 100%);
}

.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
