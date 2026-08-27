<template>
  <div class="background-manager">
    <div class="bg-preview" :style="previewStyle">
      <div class="bg-overlay"></div>
    </div>

    <div class="bg-controls">
      <div class="control-group">
        <label>背景类型</label>
        <select v-model="bgType" @change="updateBackground">
          <option value="default">默认渐变</option>
          <option value="custom">自定义图片</option>
          <option value="unsplash">Unsplash 随机</option>
        </select>
      </div>

      <div class="control-group" v-if="bgType === 'custom'">
        <label>图片 URL</label>
        <input
          v-model="customUrl"
          type="text"
          placeholder="输入图片 URL"
          @change="updateBackground"
        />
      </div>

      <div class="control-group">
        <label>不透明度</label>
        <input
          v-model.number="opacity"
          type="range"
          min="0"
          max="1"
          step="0.1"
          @change="updateBackground"
        />
        <span class="value">{{ Math.round(opacity * 100) }}%</span>
      </div>

      <div class="control-group">
        <label>模糊度</label>
        <input
          v-model.number="blur"
          type="range"
          min="0"
          max="20"
          step="1"
          @change="updateBackground"
        />
        <span class="value">{{ blur }}px</span>
      </div>

      <button @click="resetBackground" class="reset-btn">重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mainStore } from '../store'

const store = mainStore()

const bgType = ref(store.config?.background?.type || 'default')
const customUrl = ref(store.config?.background?.customUrl || '')
const opacity = ref(store.config?.background?.opacity || 1)
const blur = ref(store.config?.background?.blur || 0)

const previewStyle = computed(() => {
  let bgImage = 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)'

  if (bgType.value === 'custom' && customUrl.value) {
    bgImage = `url('${customUrl.value}')`
  } else if (bgType.value === 'unsplash') {
    bgImage = `url('https://source.unsplash.com/1920x1080/?nature,landscape')`
  }

  return {
    backgroundImage: bgImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: opacity.value,
    filter: `blur(${blur.value}px)`
  }
})

const updateBackground = () => {
  if (store.config) {
    store.config.background = {
      type: bgType.value,
      customUrl: customUrl.value,
      opacity: opacity.value,
      blur: blur.value
    }
    // 应用到页面
    applyBackground()
  }
}

const resetBackground = () => {
  bgType.value = 'default'
  customUrl.value = ''
  opacity.value = 1
  blur.value = 0
  updateBackground()
}

const applyBackground = () => {
  const bg = store.config?.background
  if (!bg) return

  let bgImage = 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)'

  if (bg.type === 'custom' && bg.customUrl) {
    bgImage = `url('${bg.customUrl}')`
  } else if (bg.type === 'unsplash') {
    bgImage = `url('https://source.unsplash.com/1920x1080/?nature,landscape')`
  }

  document.body.style.backgroundImage = bgImage
  document.body.style.backgroundSize = 'cover'
  document.body.style.backgroundPosition = 'center'
  document.body.style.backgroundAttachment = 'fixed'
  document.body.style.opacity = bg.opacity
  document.body.style.filter = `blur(${bg.blur}px)`
}
</script>

<style lang="scss" scoped>
.background-manager {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.bg-preview {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.bg-overlay {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
}

.bg-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    min-width: 60px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
  }

  select, input[type="text"] {
    flex: 1;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #fff;
    font-size: 0.85rem;

    &:focus {
      border-color: var(--theme-primary);
      outline: none;
    }
  }

  input[type="range"] {
    flex: 1;
  }

  .value {
    min-width: 40px;
    text-align: right;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
}

.reset-btn {
  padding: 8px 16px;
  background: rgba(255, 0, 100, 0.2);
  border: 1px solid rgba(255, 0, 100, 0.3);
  border-radius: 6px;
  color: #ff0064;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 0, 100, 0.3);
  }
}
</style>
