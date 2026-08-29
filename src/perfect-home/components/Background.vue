<template>
  <div class="background">
    <img
      v-for="(_, index) in backgroundLayers"
      :key="index"
      ref="backgroundImageElements"
      class="bg-image"
      :class="{ active: activeLayer === index }"
      :src="backgroundLayers[index] || undefined"
      alt=""
      aria-hidden="true"
    />
    <div class="bg-overlay"></div>
    <canvas ref="canvas" class="particles" v-show="store.particlesEnabled"></canvas>
  </div>
</template>

<script setup>
import { nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
import { mainStore } from '../store'

const props = defineProps({
  autoSwitchPaused: { type: Boolean, default: false }
})
const store = mainStore()
const canvas = ref(null)
let ctx = null
let particles = []
let animationId = null
let bgSwitchTimer = null
let backgroundRequestId = 0
const backgroundLayers = ref(['', ''])
const backgroundImageElements = ref([])
const activeLayer = ref(0)
const displayedBackground = ref('')
const imageCache = new Map()

const preloadBackground = (url) => {
  if (!url) return Promise.reject(new Error('背景地址为空'))
  if (imageCache.has(url)) return imageCache.get(url)

  const request = new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = async () => {
      try {
        if (image.decode) await image.decode()
      } catch {
        // onload 已确认图片可用；部分浏览器可能不支持或拒绝重复 decode。
      }
      resolve(url)
    }
    image.onerror = () => reject(new Error(`背景加载失败: ${url}`))
    image.src = url
  })

  imageCache.set(url, request)
  request.catch(() => imageCache.delete(url))
  return request
}

const preloadUpcomingBackground = () => {
  const nextUrl = store.nextBgUrl
  if (nextUrl && nextUrl !== displayedBackground.value) {
    preloadBackground(nextUrl).catch(() => {})
  }
}

const waitForLayerDecode = async (layerIndex) => {
  await nextTick()
  const image = backgroundImageElements.value[layerIndex]
  if (!image) return

  if (image.decode) {
    try {
      await image.decode()
      return
    } catch {
      // 预加载已验证资源可用，继续兼容不稳定的 decode 实现。
    }
  }

  if (!image.complete) {
    await new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true })
      image.addEventListener('error', resolve, { once: true })
    })
  }
}

const displayBackground = async (url) => {
  if (!url || url === displayedBackground.value) return
  const requestId = ++backgroundRequestId

  try {
    await preloadBackground(url)
    if (requestId !== backgroundRequestId) return

    if (!displayedBackground.value) {
      backgroundLayers.value[activeLayer.value] = url
      await waitForLayerDecode(activeLayer.value)
      if (requestId !== backgroundRequestId) return
      displayedBackground.value = url
      store.setImgLoadStatus(true)
      preloadUpcomingBackground()
      return
    }

    const nextLayer = activeLayer.value === 0 ? 1 : 0
    backgroundLayers.value[nextLayer] = url
    await waitForLayerDecode(nextLayer)
    if (requestId !== backgroundRequestId) return
    requestAnimationFrame(() => {
      if (requestId !== backgroundRequestId) return
      activeLayer.value = nextLayer
      displayedBackground.value = url
      preloadUpcomingBackground()
    })
  } catch (error) {
    console.error(error)
    if (!displayedBackground.value) store.setImgLoadStatus(true)
  }
}

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
  if (bgSwitchTimer) {
    clearInterval(bgSwitchTimer)
    bgSwitchTimer = null
  }
  if (props.autoSwitchPaused) return
  // 每30秒自动切换一次背景
  bgSwitchTimer = setInterval(() => {
    store.nextBg()
  }, 30000)
}

const resizeCanvas = () => {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

onMounted(() => {
  if (store.particlesEnabled) {
    initParticles()
  }

  watch(() => store.currentBg, (url) => {
    displayBackground(url)
  }, { immediate: true })

  watch(() => props.autoSwitchPaused, () => {
    startAutoSwitch()
  })

  // 启动自动切换
  startAutoSwitch()

  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (bgSwitchTimer) clearInterval(bgSwitchTimer)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style lang="scss" scoped>
.background {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: #050712;
}

.bg-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0;
  transform: scale(1.002);
  transition: opacity 0.8s ease-in-out;
  will-change: opacity;
}

.bg-image.active {
  opacity: 1;
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
