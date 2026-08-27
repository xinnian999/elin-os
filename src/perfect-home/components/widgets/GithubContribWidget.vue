<template>
  <div class="widget github-widget">
    <div class="widget-header">
      <span class="widget-icon">📊</span>
      <span class="widget-title">GitHub 贡献</span>
      <button class="refresh-btn" @click="fetchContrib" :class="{ spinning: loading }">🔄</button>
    </div>

    <div class="contrib-content" v-if="contribData">
      <div class="contrib-stats">
        <div class="stat-item">
          <span class="stat-value">{{ contribData.total }}</span>
          <span class="stat-label">今年贡献</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ contribData.streak }}</span>
          <span class="stat-label">连续天数</span>
        </div>
      </div>

      <div class="contrib-graph">
        <div class="week" v-for="(week, wi) in contribData.weeks" :key="wi">
          <div
            class="day"
            v-for="(day, di) in week"
            :key="di"
            :class="getLevelClass(day.count)"
            :title="`${day.date}: ${day.count} 次贡献`"
          ></div>
        </div>
      </div>

      <div class="contrib-legend">
        <span class="legend-label">少</span>
        <div class="legend-squares">
          <div class="legend-square level-0"></div>
          <div class="legend-square level-1"></div>
          <div class="legend-square level-2"></div>
          <div class="legend-square level-3"></div>
          <div class="legend-square level-4"></div>
        </div>
        <span class="legend-label">多</span>
      </div>
    </div>

    <div class="loading" v-else-if="loading">
      <div class="loading-spinner"></div>
      <span>加载贡献数据...</span>
    </div>

    <div class="error" v-else>
      <span class="error-icon">📭</span>
      <span class="error-text">{{ error || '无法加载贡献数据' }}</span>
      <button class="retry-btn" @click="fetchContrib">重试</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(true)
const error = ref('')
const contribData = ref(null)

// 贡献等级颜色
const getLevelClass = (count) => {
  if (count === 0) return 'level-0'
  if (count <= 2) return 'level-1'
  if (count <= 5) return 'level-2'
  if (count <= 9) return 'level-3'
  return 'level-4'
}

// 获取GitHub token和用户名
const getConfig = () => {
  try {
    // 从 localStorage 获取（用户在设置中配置的）
    const githubUser = localStorage.getItem('github_user') || ''
    const githubToken = localStorage.getItem('github_token') || ''
    return { user: githubUser, token: githubToken }
  } catch {
    return { user: '', token: '' }
  }
}

const fetchContrib = async () => {
  loading.value = true
  error.value = ''

  const { user, token } = getConfig()

  if (!user) {
    // 没有配置用户名，显示示例数据
    contribData.value = generateDemoData()
    loading.value = false
    return
  }

  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    }
    if (token) {
      headers['Authorization'] = `token ${token}`
    }

    const res = await fetch(`https://api.github.com/users/${user}/events?per_page=100`, { headers })

    if (!res.ok) {
      throw new Error('获取失败')
    }

    const events = await res.json()
    const contribMap = {}
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    // 统计每日贡献
    events.forEach(event => {
      const date = event.created_at.split('T')[0]
      if (new Date(date) >= oneYearAgo) {
        contribMap[date] = (contribMap[date] || 0) + 1
      }
    })

    // 生成周数据（过去52周）
    const weeks = []
    let currentStreak = 0
    let maxStreak = 0
    let total = 0

    for (let i = 51; i >= 0; i--) {
      const week = []
      for (let j = 0; j < 7; j++) {
        const d = new Date(today)
        d.setDate(d.getDate() - (i * 7 + (6 - j)))
        const dateStr = d.toISOString().split('T')[0]
        const count = contribMap[dateStr] || 0
        week.push({ date: dateStr, count })
        total += count

        if (count > 0) {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else {
          currentStreak = 0
        }
      }
      weeks.push(week)
    }

    contribData.value = {
      weeks,
      total,
      streak: maxStreak
    }

  } catch (e) {
    error.value = e.message
    // 失败时显示示例
    contribData.value = generateDemoData()
  }

  loading.value = false
}

// 生成示例数据
const generateDemoData = () => {
  const weeks = []
  const today = new Date()

  for (let i = 51; i >= 0; i--) {
    const week = []
    for (let j = 0; j < 7; j++) {
      const d = new Date(today)
      d.setDate(d.getDate() - (i * 7 + (6 - j)))
      week.push({
        date: d.toISOString().split('T')[0],
        count: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0
      })
    }
    weeks.push(week)
  }

  return { weeks, total: 126, streak: 5 }
}

onMounted(() => {
  fetchContrib()
})
</script>

<style lang="scss" scoped>
.github-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  min-height: 140px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px var(--theme-glow);
    border-color: var(--theme-primary);
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.widget-icon { font-size: 16px; }

.widget-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--theme-primary);
}

.refresh-btn {
  margin-left: auto;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;

  &:hover { background: rgba(0, 212, 255, 0.2); }
  &.spinning { animation: spin 1s linear infinite; }
}

@keyframes spin { to { transform: rotate(360deg); } }

.contrib-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
}

.contrib-graph {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 2px; }
  &::-webkit-scrollbar-thumb { background: var(--theme-primary); border-radius: 2px; }
}

.week {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover { transform: scale(1.3); }
}

.level-0 { background: rgba(255,255,255,0.1); }
.level-1 { background: rgba(46, 204, 113, 0.4); }
.level-2 { background: rgba(46, 204, 113, 0.6); }
.level-3 { background: rgba(46, 204, 113, 0.8); }
.level-4 { background: #2ecc71; }

.contrib-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
}

.legend-label {
  font-size: 0.6rem;
  color: rgba(255,255,255,0.4);
}

.legend-squares {
  display: flex;
  gap: 2px;
}

.legend-square {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;

  span { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: var(--theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.error-icon { font-size: 28px; opacity: 0.5; }
.error-text { font-size: 0.75rem; color: rgba(255,255,255,0.5); }

.retry-btn {
  margin-top: 4px;
  padding: 4px 12px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  color: rgba(255,255,255,0.7);
  font-size: 0.7rem;
  cursor: pointer;

  &:hover { background: rgba(0,212,255,0.2); }
}
</style>
