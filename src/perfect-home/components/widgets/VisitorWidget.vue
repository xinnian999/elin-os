<template>
  <div class="widget visitor-widget">
    <div class="widget-header">
      <span class="widget-icon">🌍</span>
      <span class="widget-title">访客信息</span>
    </div>
    <div class="visitor-content" v-if="visitorData">
      <div class="visitor-item">
        <span class="label">📍 位置</span>
        <span class="value">{{ locationText }}</span>
      </div>
      <div class="visitor-item">
        <span class="label">🌐 IP</span>
        <span class="value ip-value" :class="{ revealed: showIp }"
              @mouseenter="showIp = true" @mouseleave="showIp = false">
          {{ showIp ? visitorData.ip : maskedIp }}
        </span>
      </div>
      <div class="visitor-item" v-if="visitorData.isp">
        <span class="label">📡 运营商</span>
        <span class="value">{{ visitorData.isp }}</span>
      </div>
      <div class="visitor-item" v-else>
        <span class="label">🕐 时区</span>
        <span class="value">{{ visitorData.timezone }}</span>
      </div>
    </div>
    <div class="loading" v-else>
      <div class="loading-spinner"></div>
      <span>定位中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mainStore } from '../../store'

const store = mainStore()
const visitorData = computed(() => store.visitor)
const showIp = ref(false)
const locationText = computed(() => [visitorData.value?.city, visitorData.value?.country_name].filter(Boolean).join(', '))

const maskedIp = computed(() => {
  if (!visitorData.value?.ip || visitorData.value.ip === '无法获取') return '无法获取'
  const parts = visitorData.value.ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.***.***.${parts[3]}`
  }
  if (visitorData.value.ip.includes(':')) {
    const segments = visitorData.value.ip.split(':').filter(Boolean)
    return segments.length > 1 ? `${segments[0]}:${segments[1]}:…` : 'IPv6（已隐藏）'
  }
  return 'IP（已隐藏）'
})

</script>

<style lang="scss" scoped>
.visitor-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  min-height: 140px;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(0, 212, 255, 0.3);
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
  color: #00d4ff;
}

.visitor-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visitor-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
}

.label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.value {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  text-align: right;
}

.ip-value {
  filter: blur(4px);
  transition: filter 0.3s;
  cursor: pointer;

  &.revealed {
    filter: blur(0);
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
