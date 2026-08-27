<template>
  <div v-if="announcement?.enabled" class="announcement-bar">
    <div class="announcement-content" :style="{ color: announcement.textColor }">
      <div class="announcement-text">
        <span v-for="(_, i) in 3" :key="i" class="announcement-item">
          {{ announcement.text }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { mainStore } from '../store'

const store = mainStore()

// 响应式读取公告配置，兼容 backgroundColor 和 bgColor 两种字段
const announcement = computed(() => {
  const a = store.config?.announcement
  if (!a) return null
  return {
    ...a,
    // 统一用 bgColor，兼容旧字段 backgroundColor
    bgColor: a.bgColor || a.backgroundColor || 'rgba(0, 212, 255, 0.1)',
    textColor: a.textColor || '#00d4ff',
    speed: a.speed || 50
  }
})
</script>

<style lang="scss" scoped>
.announcement-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: v-bind('announcement?.bgColor || "rgba(0, 212, 255, 0.1)"');
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  overflow: hidden;
  z-index: 999;
  backdrop-filter: blur(10px);
}

.announcement-content {
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
}

.announcement-text {
  display: flex;
  animation: scroll linear infinite;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  animation-duration: v-bind('(announcement?.speed || 50) + "s"');
}

.announcement-item {
  padding: 0 40px;
  display: inline-block;
}

@keyframes scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-33.333%); }
}

@media (max-width: 768px) {
  .announcement-bar { height: 35px; }
  .announcement-text { font-size: 12px; }
  .announcement-item { padding: 0 20px; }
}
</style>
