<template>
  <div class="card visitor-card">
    <div class="card-header">
      <span class="title">🌍 访客信息</span>
    </div>
    <div class="visitor-content" v-if="visitor">
      <div class="visitor-item">
        <span class="label">📍 地区</span>
        <span class="value">{{ visitor.city }}, {{ visitor.country }}</span>
      </div>
      <div class="visitor-item">
        <span class="label">🌐 IP</span>
        <span class="value blurred" @mouseenter="showIP = true" @mouseleave="showIP = false">
          {{ showIP ? visitor.ip : '点击查看' }}
        </span>
      </div>
      <div class="visitor-item">
        <span class="label">💻 系统</span>
        <span class="value">{{ visitor.os }}</span>
      </div>
      <div class="visitor-item">
        <span class="label">🔧 浏览器</span>
        <span class="value">{{ visitor.browser }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const visitor = ref(null)
const showIP = ref(false)

const getOS = () => {
  const ua = navigator.userAgent
  if (ua.includes('Windows NT 10')) return 'Windows 10/11'
  if (ua.includes('Windows NT 6.3')) return 'Windows 8.1'
  if (ua.includes('Windows NT 6.1')) return 'Windows 7'
  if (ua.includes('Mac OS X')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS')) return 'iOS'
  return '未知系统'
}

const getBrowser = () => {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE'
  return '未知浏览器'
}

const fetchVisitor = async () => {
  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    visitor.value = {
      city: data.city || '未知',
      country: data.country_name || '未知',
      ip: data.ip || '未知',
      os: getOS(),
      browser: getBrowser()
    }
  } catch {
    visitor.value = {
      city: '未知',
      country: '未知',
      ip: '未知',
      os: getOS(),
      browser: getBrowser()
    }
  }
}

onMounted(fetchVisitor)
</script>

<style lang="scss" scoped>
.visitor-card {
  .visitor-content {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .visitor-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid $border;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 14px;
        color: $text-light;
      }

      .value {
        font-size: 14px;
        color: $text;

        &.blurred {
          cursor: pointer;
          color: $primary;
          transition: $transition;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }
}
</style>
