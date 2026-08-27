<template>
  <div class="time-capsule">
    <div class="modal-header">
      <h2>⏳ 时间胶囊</h2>
      <button class="close-btn" @click="$emit('close')">
        <Icon size="24"><Close /></Icon>
      </button>
    </div>
    <div class="capsule-content">
      <div class="progress-item">
        <div class="progress-header">
          <span class="label">☀️ 今日进度</span>
          <span class="value">{{ dayProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: dayProgress + '%' }"></div>
        </div>
      </div>
      <div class="progress-item">
        <div class="progress-header">
          <span class="label">📅 本周进度</span>
          <span class="value">{{ weekProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: weekProgress + '%' }"></div>
        </div>
      </div>
      <div class="progress-item">
        <div class="progress-header">
          <span class="label">🗓️ 本月进度</span>
          <span class="value">{{ monthProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: monthProgress + '%' }"></div>
        </div>
      </div>
      <div class="progress-item">
        <div class="progress-header">
          <span class="label">📆 今年进度</span>
          <span class="value">{{ yearProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: yearProgress + '%' }"></div>
        </div>
      </div>
      <div class="life-progress">
        <div class="life-header">
          <span>🎂 人生进度</span>
          <span class="age">假设 80 岁，已过 {{ age }} 岁</span>
        </div>
        <div class="life-bar">
          <div class="fill" :style="{ width: lifeProgress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@vicons/utils'
import { Close } from '@vicons/ionicons5'
import dayjs from 'dayjs'

defineEmits(['close'])

const now = ref(new Date())
let timer = null

// 计算各进度
const dayProgress = computed(() => {
  const h = now.value.getHours()
  const m = now.value.getMinutes()
  return ((h * 60 + m) / 1440 * 100).toFixed(1)
})

const weekProgress = computed(() => {
  const day = now.value.getDay() || 7
  const h = now.value.getHours()
  const m = now.value.getMinutes()
  const total = (day - 1) * 1440 + h * 60 + m
  return (total / (7 * 1440) * 100).toFixed(1)
})

const monthProgress = computed(() => {
  const date = now.value.getDate()
  const days = new Date(now.value.getFullYear(), now.value.getMonth() + 1, 0).getDate()
  return (date / days * 100).toFixed(1)
})

const yearProgress = computed(() => {
  const start = new Date(now.value.getFullYear(), 0, 1)
  const end = new Date(now.value.getFullYear() + 1, 0, 1)
  return ((now.value - start) / (end - start) * 100).toFixed(1)
})

const age = computed(() => {
  // 假设出生年份
  const birthYear = 2000
  return now.value.getFullYear() - birthYear
})

const lifeProgress = computed(() => {
  return (age.value / 80 * 100).toFixed(1)
})

onMounted(() => {
  timer = setInterval(() => now.value = new Date(), 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
.time-capsule {
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  background: $bg-card;
  backdrop-filter: blur(20px);
  border: 1px solid $border;
  border-radius: $border-radius-lg;
  padding: 24px;
  animation: fadeUp 0.3s ease;

  @include scrollbar;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      font-size: 1.5rem;
      @include text-gradient;
    }

    .close-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: $text-light;
      transition: $transition;

      &:hover {
        background: rgba(255, 0, 137, 0.2);
        color: $accent;
      }
    }
  }

  .capsule-content {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .progress-item {
      .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        .label {
          font-size: 14px;
          color: $text;
        }

        .value {
          font-size: 14px;
          font-weight: 700;
          color: $primary;
        }
      }

      .progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;

        .fill {
          height: 100%;
          background: $gradient-primary;
          border-radius: 4px;
          transition: width 0.5s ease;
          position: relative;

          &::after {
            content: '';
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 10px white;
          }
        }
      }
    }

    .life-progress {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid $border;

      .life-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        span:first-child {
          font-size: 16px;
          font-weight: 600;
          color: $text;
        }

        .age {
          font-size: 13px;
          color: $text-light;
        }
      }

      .life-bar {
        height: 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        overflow: hidden;

        .fill {
          height: 100%;
          background: $gradient-accent;
          border-radius: 6px;
          transition: width 0.5s ease;
        }
      }
    }
  }
}
</style>
