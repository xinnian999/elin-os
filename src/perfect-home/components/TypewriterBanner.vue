<template>
  <div class="typewriter-banner" v-if="lines.length > 0">
    <span class="typewriter-text">{{ displayText }}<span class="cursor" :class="{ blink: !isTyping }">|</span></span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { mainStore } from '../store'

const store = mainStore()

// 响应式读取打字机文案
const defaultLines = [
  '欢迎来到我的主页 👋',
  '代码改变世界 🌍',
  '保持好奇，持续学习 ✨',
  '生活不止眼前的 Bug 🐛'
]

const lines = computed(() => {
  const configLines = store.config?.site?.typewriterLines
  return configLines?.length ? configLines : defaultLines
})

const displayText = ref('')
const isTyping = ref(true)
let currentLineIdx = 0
let charIdx = 0
let timer = null
let pauseTimer = null

const typeNext = () => {
  const line = lines.value[currentLineIdx]
  if (charIdx < line.length) {
    displayText.value += line[charIdx]
    charIdx++
    isTyping.value = true
    timer = setTimeout(typeNext, 80)
  } else {
    isTyping.value = false
    pauseTimer = setTimeout(deleteText, 2000)
  }
}

const deleteText = () => {
  if (displayText.value.length > 0) {
    displayText.value = displayText.value.slice(0, -1)
    isTyping.value = true
    timer = setTimeout(deleteText, 40)
  } else {
    currentLineIdx = (currentLineIdx + 1) % lines.value.length
    charIdx = 0
    isTyping.value = false
    timer = setTimeout(typeNext, 500)
  }
}

const startTyping = () => {
  if (lines.value.length > 0) {
    currentLineIdx = 0
    charIdx = 0
    displayText.value = ''
    timer = setTimeout(typeNext, 800)
  }
}

// 监听配置变化，重新开始打字
watch(() => lines.value, () => {
  if (timer) clearTimeout(timer)
  if (pauseTimer) clearTimeout(pauseTimer)
  startTyping()
}, { deep: true })

onMounted(startTyping)

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (pauseTimer) clearTimeout(pauseTimer)
})
</script>

<style lang="scss" scoped>
.typewriter-banner {
  text-align: center;
  padding: 8px 0 4px;
  pointer-events: none;
}

.typewriter-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 400;
  letter-spacing: 0.5px;
}

.cursor {
  display: inline-block;
  color: var(--theme-primary);
  font-weight: 300;
  margin-left: 1px;

  &.blink {
    animation: blink 1s step-end infinite;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
