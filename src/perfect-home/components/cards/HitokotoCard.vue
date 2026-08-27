<template>
  <div class="card hitokoto-card">
    <div class="card-header">
      <span class="title">💬 一言</span>
      <button class="refresh-btn" @click="fetchHitokoto" :disabled="loading">
        <Icon size="16">
          <Refresh :class="{ spinning: loading }" />
        </Icon>
      </button>
    </div>
    <div class="hitokoto-content">
      <p class="text">"{{ hitokoto.text }}"</p>
      <p class="from">—— {{ hitokoto.from }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@vicons/utils'
import { Refresh } from '@vicons/ionicons5'

const hitokoto = ref({ text: '生活不止眼前的苟且，还有诗和远方。', from: '高晓松' })
const loading = ref(false)

const fetchHitokoto = async () => {
  loading.value = true
  try {
    const res = await fetch('https://v1.hitokoto.cn')
    const data = await res.json()
    hitokoto.value = {
      text: data.hitokoto,
      from: data.from_who || '佚名' + (data.from ? `《${data.from}》` : '')
    }
  } catch {
    // 保持默认值
  }
  loading.value = false
}

onMounted(fetchHitokoto)
</script>

<style lang="scss" scoped>
.hitokoto-card {
  .hitokoto-content {
    .text {
      font-size: 15px;
      line-height: 1.8;
      color: $text;
      margin-bottom: 12px;
      font-style: italic;
    }

    .from {
      font-size: 13px;
      color: $text-light;
      text-align: right;
    }
  }
}
</style>
