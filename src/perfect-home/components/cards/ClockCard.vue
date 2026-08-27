<template>
  <div class="card clock-card">
    <div class="time">{{ timeStr }}</div>
    <div class="date">{{ dateStr }}</div>
    <div class="greeting">{{ greeting }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'

const now = ref(new Date())
let timer = null

const timeStr = computed(() => dayjs(now.value).format('HH:mm:ss'))
const dateStr = computed(() => dayjs(now.value).format('YYYY年MM月DD日 dddd'))

const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 6) return '🌙 夜深了，注意休息'
  if (h < 9) return '🌅 早上好，新的一天开始了'
  if (h < 12) return '☀️ 上午好，工作顺利'
  if (h < 14) return '🍚 中午好，记得吃饭'
  if (h < 18) return '🌤️ 下午好，继续加油'
  if (h < 22) return '🌆 傍晚好，放松一下吧'
  return '🌙 晚上好，早点休息'
})

onMounted(() => {
  timer = setInterval(() => now.value = new Date(), 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
.clock-card {
  text-align: center;
  padding: 30px 20px;

  .time {
    font-size: 4rem;
    font-weight: 700;
    @include text-gradient;
    letter-spacing: 4px;
    line-height: 1;
    margin-bottom: 10px;

    @media (max-width: $mobile) {
      font-size: 3rem;
    }
  }

  .date {
    font-size: 1rem;
    color: $text-light;
    margin-bottom: 8px;
  }

  .greeting {
    font-size: 0.9rem;
    color: $primary;
  }
}
</style>
