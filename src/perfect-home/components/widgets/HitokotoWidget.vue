<template>
  <div class="widget hitokoto-widget">
    <div class="widget-header">
      <span class="widget-icon">💬</span>
      <span class="widget-title">{{ currentSource.label }}</span>
      <button class="refresh-btn" @click="fetchContent">🔄</button>
      <button class="switch-btn" @click="switchSource" title="切换类型">🔁</button>
    </div>
    <div class="hitokoto-content" v-if="content">
      <div class="hitokoto-text">"{{ content.text }}"</div>
      <div class="hitokoto-from" v-if="content.from">—— {{ content.from }}</div>
    </div>
    <div class="loading" v-else>
      <span class="loading-text">加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const content = ref(null)
const currentSource = ref({ type: 'hitokoto', label: '一言' })

// 数据源列表
const sources = [
  { type: 'hitokoto', label: '一言', api: 'https://v1.hitokoto.cn' },
  { type: 'jinrishici', label: '古诗', api: 'https://v2.jinrishici.com/info' },
  { type: 'dictum', label: '英语', api: 'https://api.shadiao.pro/dictum' }
]

const fetchHitokoto = async () => {
  try {
    const res = await fetch('https://v1.hitokoto.cn?c=i')
    const data = await res.json()
    content.value = { text: data.hitokoto, from: data.from }
  } catch (e) {
    content.value = { text: '获取失败', from: '' }
  }
}

const fetchJinrishici = async () => {
  try {
    // v1 接口无需 token，直接返回诗句
    const res = await fetch('https://v1.jinrishici.com/all.json')
    const data = await res.json()
    if (data.content) {
      content.value = {
        text: data.content,
        from: data.author + ' 《' + data.origin + '》'
      }
    }
  } catch (e) {
    content.value = { text: '获取失败', from: '' }
  }
}

const fetchDictum = async () => {
  try {
    // zenquotes.io 免费英语名言 API
    const res = await fetch('https://zenquotes.io/api/random')
    const data = await res.json()
    if (data && data[0]) {
      content.value = { text: data[0].q, from: data[0].a }
    }
  } catch (e) {
    content.value = { text: 'Failed to fetch quote.', from: '' }
  }
}

const fetchContent = async () => {
  content.value = null
  const type = currentSource.value.type
  if (type === 'hitokoto') await fetchHitokoto()
  else if (type === 'jinrishici') await fetchJinrishici()
  else if (type === 'dictum') await fetchDictum()
}

const switchSource = () => {
  const idx = sources.findIndex(s => s.type === currentSource.value.type)
  const nextIdx = (idx + 1) % sources.length
  currentSource.value = sources[nextIdx]
  fetchContent()
}

onMounted(() => {
  fetchContent()
})
</script>

<style lang="scss" scoped>
.hitokoto-widget {
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

.widget-icon {
  font-size: 16px;
}

.widget-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--theme-primary);
}

.refresh-btn, .switch-btn {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
  }
}

.switch-btn {
  margin-left: 2px;
}

.hitokoto-content {
  text-align: center;
}

.hitokoto-text {
  font-size: 0.85rem;
  line-height: 1.6;
  font-style: italic;
  background: var(--theme-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hitokoto-from {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
}

.loading {
  text-align: center;
  padding: 20px 0;
}

.loading-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}
</style>
