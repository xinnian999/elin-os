import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const mainStore = defineStore('main', () => {
  // ==================== 配置 ====================
  const config = ref(null)

  const setConfig = (cfg) => {
    config.value = cfg
    if (cfg?.socials) {
      socials.value = cfg.socials.map(s => ({ ...s }))
    }
    if (cfg?.links) {
      links.value = cfg.links.map(l => ({ ...l }))
    }
    if (cfg?.site) {
      siteStartDate.value = cfg.site.startDate
    }
  }

  // ==================== 基础状态 ====================
  const imgLoadStatus = ref(false)
  const innerWidth = ref(window.innerWidth)
  const siteStartDate = ref('2024-01-01')
  const now = ref(new Date())

  // 主题设置
  const themeMode = ref(localStorage.getItem('themeMode') || 'auto')
  const activeTheme = ref(localStorage.getItem('activeTheme') || 'cyberpunk')

  // 预设主题配置
  const themes = {
    cyberpunk: {
      name: '赛博朋克',
      primary: '#00d4ff',
      secondary: '#7b2ff7',
      gradient: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
      glass: 'rgba(0, 212, 255, 0.1)',
      glow: 'rgba(0, 212, 255, 0.3)'
    },
    sunset: {
      name: '落日余晖',
      primary: '#ff6b6b',
      secondary: '#ffa502',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%)',
      glass: 'rgba(255, 107, 107, 0.1)',
      glow: 'rgba(255, 107, 107, 0.3)'
    },
    forest: {
      name: '清新森林',
      primary: '#26de81',
      secondary: '#20bf6b',
      gradient: 'linear-gradient(135deg, #26de81 0%, #20bf6b 100%)',
      glass: 'rgba(38, 222, 129, 0.1)',
      glow: 'rgba(38, 222, 129, 0.3)'
    },
    ocean: {
      name: '深海之谜',
      primary: '#4834d4',
      secondary: '#686de0',
      gradient: 'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
      glass: 'rgba(72, 52, 212, 0.1)',
      glow: 'rgba(72, 52, 212, 0.3)'
    },
    aurora: {
      name: '极光幻彩',
      primary: '#ff9ff3',
      secondary: '#54a0ff',
      gradient: 'linear-gradient(135deg, #ff9ff3 0%, #54a0ff 100%)',
      glass: 'rgba(255, 159, 243, 0.1)',
      glow: 'rgba(255, 159, 243, 0.3)'
    }
  }

  const currentTheme = computed(() => themes[activeTheme.value] || themes.cyberpunk)

  const setTheme = (themeKey) => {
    if (themes[themeKey]) {
      activeTheme.value = themeKey
      localStorage.setItem('activeTheme', themeKey)
      // 应用 CSS 变量
      const t = themes[themeKey]
      document.documentElement.style.setProperty('--theme-primary', t.primary)
      document.documentElement.style.setProperty('--theme-secondary', t.secondary)
      document.documentElement.style.setProperty('--theme-gradient', t.gradient)
      document.documentElement.style.setProperty('--theme-glass', t.glass)
      document.documentElement.style.setProperty('--theme-glow', t.glow)
    }
  }

  const language = ref(localStorage.getItem('language') || 'zh')
  const setLanguage = (lang) => {
    language.value = lang
    localStorage.setItem('language', lang)
  }

  // ==================== 设置面板 ====================
  const setOpenState = ref(false)
  const activeMenu = ref('personalize')

  // ==================== 背景轮播 ====================
  const defaultBgImages = [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80',
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80',
    'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1920&q=80',
    'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80'
  ]

  const currentBgIndex = ref(0)
  const currentBg = computed(() => defaultBgImages[currentBgIndex.value])
  const nextBgUrl = computed(() => defaultBgImages[(currentBgIndex.value + 1) % defaultBgImages.length])
  const nextBg = () => { currentBgIndex.value = (currentBgIndex.value + 1) % defaultBgImages.length }

  // ==================== 音乐播放器 ====================
  const musicVolume = ref(0.7)
  const playerLoop = ref('all')
  const playerOrder = ref('list')

  // ==================== 访客信息 ====================
  const visitor = ref(null)
  const fetchVisitor = async () => {
    try {
      const response = await fetch('/api/visitor', { cache: 'no-store' })
      if (!response.ok) throw new Error('访客信息不可用')
      const data = await response.json()
      let countryName = data.country || '未知国家/地区'
      try {
        countryName = new Intl.DisplayNames(['zh-CN'], { type: 'region' }).of(data.country) || countryName
      } catch { /* 浏览器不支持 Intl.DisplayNames 时使用国家代码 */ }
      visitor.value = {
        ...data,
        city: data.city || data.region || '未知位置',
        country_name: countryName,
        ip: data.ip || '无法获取',
        timezone: data.timezone || '未知时区'
      }
    } catch {
      visitor.value = { city: '无法定位', country_name: '', ip: '无法获取', isp: '', timezone: '未知时区' }
    }
  }

  // ==================== 天气 ====================
  const weather = ref(null)
  const weatherLoading = ref(true)

  const fetchWeather = async () => {
    weatherLoading.value = true
    try {
      const response = await fetch('/api/weather', { cache: 'no-store' })
      if (!response.ok) throw new Error('天气信息不可用')
      weather.value = await response.json()
    } catch {
      weather.value = null
    } finally {
      weatherLoading.value = false
    }
  }

  // ==================== 时间 ====================
  setInterval(() => { now.value = new Date() }, 1000)

  const timeStr = computed(() => now.value.toLocaleTimeString('zh-CN', { hour12: false }))

  const greeting = computed(() => {
    const h = now.value.getHours()
    if (h >= 0 && h < 6) return '🌙 夜深了，注意休息~'
    if (h >= 6 && h < 9) return '🌅 早上好，元气满满！'
    if (h >= 9 && h < 12) return '☀️ 上午好，加油打工！'
    if (h >= 12 && h < 14) return '🍚 中午好，记得吃饭！'
    if (h >= 14 && h < 18) return '🌤️ 下午好，继续努力！'
    if (h >= 18 && h < 21) return '🌆 傍晚好，辛苦了！'
    return '🌙 晚上好，早点休息！'
  })

  // ==================== 时光进度 ====================
  const dayProgress = computed(() => { const mins = now.value.getHours() * 60 + now.value.getMinutes(); return (mins / 1440 * 100).toFixed(1) })
  const weekProgress = computed(() => { const day = now.value.getDay() || 7; const mins = (day - 1) * 1440 + now.value.getHours() * 60 + now.value.getMinutes(); return (mins / (7 * 1440) * 100).toFixed(1) })
  const monthProgress = computed(() => { const days = new Date(now.value.getFullYear(), now.value.getMonth() + 1, 0).getDate(); return (now.value.getDate() / days * 100).toFixed(1) })
  const yearProgress = computed(() => { const start = new Date(now.value.getFullYear(), 0, 1); const end = new Date(now.value.getFullYear() + 1, 0, 1); return ((now.value - start) / (end - start) * 100).toFixed(1) })

  const siteDays = computed(() => { const start = new Date(siteStartDate.value); const today = new Date(); return Math.floor((today - start) / (1000 * 60 * 60 * 24)) })

  // ==================== 番茄钟 ====================
  const pomoDuration = ref(25)
  const pomoTime = ref(25 * 60)
  const pomoRunning = ref(false)
  const pomoStats = ref({})

  let pomoTimer = null

  const startPomo = () => {
    pomoRunning.value = true
    pomoTimer = setInterval(() => {
      if (pomoTime.value > 0) { pomoTime.value-- }
      else { const today = new Date().toLocaleDateString(); pomoStats.value[today] = (pomoStats.value[today] || 0) + 1; stopPomo() }
    }, 1000)
  }

  const stopPomo = () => { pomoRunning.value = false; if (pomoTimer) clearInterval(pomoTimer) }
  const resetPomo = () => { stopPomo(); pomoTime.value = pomoDuration.value * 60 }
  const setPomoDuration = (min) => { pomoDuration.value = min; resetPomo() }

  // ==================== 项目链接 ====================
  const links = ref([])

  // ==================== 社交链接 ====================
  const socials = ref([])

  // ==================== 粒子效果 ====================
  const particlesEnabled = ref(localStorage.getItem('particlesEnabled') !== 'false')
  const setParticlesEnabled = (val) => {
    particlesEnabled.value = val
    localStorage.setItem('particlesEnabled', val)
  }

  // ==================== 自定义鼠标 ====================
  const customCursorEnabled = ref(localStorage.getItem('customCursorEnabled') === 'true')
  const setCustomCursorEnabled = (val) => {
    customCursorEnabled.value = val
    localStorage.setItem('customCursorEnabled', String(val))
    // 开启时隐藏系统鼠标
    document.documentElement.style.cursor = val ? 'none' : ''
    document.body.style.cursor = val ? 'none' : ''
  }
  // 初始化时恢复状态
  if (customCursorEnabled.value) {
    document.documentElement.style.cursor = 'none'
    document.body.style.cursor = 'none'
  }

  // ==================== 鼠标效果 ====================
  const mouseX = ref(0)
  const mouseY = ref(0)
  const updateMouse = (e) => { mouseX.value = e.clientX; mouseY.value = e.clientY }

  // ==================== 动作 ====================
  const setInnerWidth = (value) => { innerWidth.value = value }
  const setImgLoadStatus = (value) => { imgLoadStatus.value = value }

  return {
    config, setConfig,
    imgLoadStatus, innerWidth, setInnerWidth, setImgLoadStatus,
    siteDays,
    themeMode, language, setLanguage,
    themes, activeTheme, currentTheme, setTheme,
    setOpenState, activeMenu,
    currentBg, nextBgUrl, nextBg,
    musicVolume, playerLoop, playerOrder,
    visitor, fetchVisitor,
    weather, weatherLoading, fetchWeather,
    now, timeStr, greeting,
    dayProgress, weekProgress, monthProgress, yearProgress,
    pomoDuration, pomoTime, pomoRunning, pomoStats,
    startPomo, stopPomo, resetPomo, setPomoDuration,
    links, socials,
    mouseX, mouseY, updateMouse,
    particlesEnabled, setParticlesEnabled,
    customCursorEnabled, setCustomCursorEnabled
  }
})
