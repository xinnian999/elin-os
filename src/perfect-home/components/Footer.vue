<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <!-- 运行时标语 -->
      <div class="slogan">{{ currentSlogan }}</div>

      <!-- 运行时间 + 访客统计 -->
      <div class="footer-stats">
        <div class="uptime">
          <span>🕐</span>
          <span class="mono">{{ days }}天 {{ hours }}时 {{ mins }}分 {{ secs }}秒</span>
        </div>
        <span class="divider">·</span>
        <div class="visitor-stats">
          <span>👁️ 今日 <b>{{ todayPv }}</b></span>
          <span class="divider">·</span>
          <span>📊 累计 <b>{{ totalPv }}</b></span>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="footer-info">
        <a :href="store.config?.profile?.githubUrl" target="_blank">⬛ Elin GitHub</a>
        <span class="dot">·</span>
        <span>Powered by Vue 3 + Vite + Pinia</span>
        <span class="dot">·</span>
        <span>Copyright © {{ year }} Elin</span>
        <span class="dot">·</span>
        <a href="https://github.com/327261086/perfect-home" target="_blank" rel="noreferrer">UI based on Perfect Home</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { mainStore } from '../store'

const store = mainStore()
const year = new Date().getFullYear()
const startDate = computed(() => new Date(store.config?.site?.startDate || '2024-01-01'))
const now = ref(Date.now())
let timer = null

// ── 运行时间 ──
const timeDiff = computed(() => now.value - startDate.value.getTime())
const days  = computed(() => Math.floor(timeDiff.value / 86400000))
const hours = computed(() => Math.floor((timeDiff.value % 86400000) / 3600000))
const mins  = computed(() => Math.floor((timeDiff.value % 3600000) / 60000))
const secs  = computed(() => Math.floor((timeDiff.value % 60000) / 1000))

// ── 访客统计（localStorage 本地计数）──
const PV_KEY   = 'ph-pv-total'
const DATE_KEY = 'ph-pv-date'
const TODAY_KEY = 'ph-pv-today'

const totalPv = ref(0)
const todayPv = ref(0)

const initPv = () => {
  const today = new Date().toDateString()
  const savedDate = localStorage.getItem(DATE_KEY)

  // 累计 PV
  totalPv.value = parseInt(localStorage.getItem(PV_KEY) || '0') + 1
  localStorage.setItem(PV_KEY, String(totalPv.value))

  // 今日 PV
  if (savedDate !== today) {
    todayPv.value = 1
    localStorage.setItem(DATE_KEY, today)
    localStorage.setItem(TODAY_KEY, '1')
  } else {
    todayPv.value = parseInt(localStorage.getItem(TODAY_KEY) || '0') + 1
    localStorage.setItem(TODAY_KEY, String(todayPv.value))
  }
}

// ── 标语 ──
const slogans = {
  stable: [
    '✨ 稳稳地运行中...',
    '🌟 健康运行第 {{days}} 天',
    '💪 坚强地运行着',
    '🎉 庆祝上线 {{days}} 天！',
    '🚀 持续运行中，状态良好'
  ],
  struggling: [
    '😅 在崩溃边缘反复试探中',
    '💔 数据库炸了但我不说',
    '🔥 服务器在燃烧但还能撑',
    '🌪️ 在灾难中艰难前行',
    '🌀 风越大，我越浪'
  ],
  ancient: [
    '🦴 骨灰级稳定运行',
    '⛓️ 运行了 {{days}} 天的老古董',
    '🗿 代码已写成传说',
    '🏛️ 文物级系统正常运行',
    '📜 见证了 {{days}} 个日出日落'
  ]
}

const currentSlogan = computed(() => {
  const d = days.value
  let pool = d < 50 ? slogans.stable : d < 100 ? slogans.struggling : slogans.ancient
  let s = pool[Math.floor(Math.random() * pool.length)]
  return s.replace('{{days}}', d)
})

onMounted(() => {
  initPv()
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.site-footer {
  width: 100%;
  padding: 12px 0;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
  margin-top: auto;
}

.footer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.slogan {
  font-size: 0.75rem;
  color: var(--theme-primary);
  opacity: 0.85;
  font-weight: 500;
}

.footer-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  flex-wrap: wrap;
  justify-content: center;
}

.uptime {
  display: flex;
  align-items: center;
  gap: 5px;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.5px;
}

.visitor-stats {
  display: flex;
  align-items: center;
  gap: 8px;

  b {
    color: var(--theme-primary);
    font-weight: 600;
  }
}

.divider {
  opacity: 0.3;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  flex-wrap: wrap;
  justify-content: center;

  a {
    color: rgba(255, 255, 255, 0.45);
    text-decoration: none;
    transition: color 0.3s;
    &:hover { color: var(--theme-primary); }
  }

  .dot { opacity: 0.3; }
}
</style>
