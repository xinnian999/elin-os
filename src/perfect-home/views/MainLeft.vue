<template>
  <div class="left">
    <!-- 头像卡片 -->
    <div class="profile-card">
      <div class="avatar-wrapper">
        <div class="avatar-ring"></div>
        <!-- 图片头像 -->
        <img v-if="avatarIsImage" :src="avatarUrl" class="avatar-img" alt="avatar" />
        <!-- Emoji 头像 -->
        <div v-else class="avatar">{{ avatar }}</div>
      </div>
      <div class="profile-info">
        <div class="logo-text">
          <span class="main">{{ siteTitle }}</span>
          <span class="sub">{{ siteDomain }}</span>
        </div>
        <div class="profile-desc">{{ identity }}<span v-if="location"> · {{ location }}</span></div>
      </div>
    </div>

    <!-- 翻转卡片：站点简介 / 更新日志 -->
    <div class="flip-card-container" @click="showSettings = !showSettings">
      <div class="flip-card" :class="{ flipped: showSettings }">
        <!-- 正面：站点简介 -->
        <div class="flip-face flip-front">
          <div class="face-bg"></div>
          <div class="face-content">
            <div class="face-header">
              <span class="face-icon">📋</span>
              <span class="face-title">站点简介</span>
            </div>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">身份</span>
                <span class="info-value">{{ identity }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">简介</span>
                <span class="info-value">{{ interests }}</span>
              </div>
            </div>
            <div class="flip-tip">点击翻转 →</div>
          </div>
        </div>

        <!-- 背面：更新日志 -->
        <div class="flip-face flip-back">
          <div class="face-content">
            <div class="face-header">
              <span class="face-icon">📝</span>
              <span class="face-title">更新日志</span>
              <span class="back-hint" @click.stop="showSettings = false">←</span>
            </div>
            <div class="changelog-list">
              <div class="cl-item" v-for="(item, i) in changelog" :key="i">
                <span class="cl-ver">{{ item.version }}</span>
                <span class="cl-desc">{{ item.desc }}</span>
              </div>
            </div>
            <button class="settings-btn" @click.stop="store.setOpenState = true">
              ⚙️ 全局设置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间胶囊横向 -->
    <div class="capsule-card">
      <div class="capsule-header">
        <span class="capsule-title">⏳ 时光</span>
        <span class="site-days">🏠 已运行 {{ store.siteDays }} 天</span>
      </div>
      <div class="capsule-bars">
        <div class="capsule-item">
          <div class="capsule-top">
            <span class="capsule-icon">☀️</span>
            <span class="capsule-val">{{ store.dayProgress }}%</span>
          </div>
          <div class="capsule-bar"><div class="capsule-fill" :style="{width: store.dayProgress+'%', background: 'var(--theme-gradient)'}"></div></div>
          <span class="capsule-label">今日</span>
        </div>
        <div class="capsule-item">
          <div class="capsule-top">
            <span class="capsule-icon">📅</span>
            <span class="capsule-val">{{ store.weekProgress }}%</span>
          </div>
          <div class="capsule-bar"><div class="capsule-fill" :style="{width: store.weekProgress+'%', background: 'linear-gradient(90deg,#7b2ff7,#5a1fc0)'}"></div></div>
          <span class="capsule-label">本周</span>
        </div>
        <div class="capsule-item">
          <div class="capsule-top">
            <span class="capsule-icon">🗓️</span>
            <span class="capsule-val">{{ store.monthProgress }}%</span>
          </div>
          <div class="capsule-bar"><div class="capsule-fill" :style="{width: store.monthProgress+'%', background: 'linear-gradient(90deg,#ff0089,#cc006e)'}"></div></div>
          <span class="capsule-label">本月</span>
        </div>
        <div class="capsule-item">
          <div class="capsule-top">
            <span class="capsule-icon">📆</span>
            <span class="capsule-val">{{ store.yearProgress }}%</span>
          </div>
          <div class="capsule-bar"><div class="capsule-fill" :style="{width: store.yearProgress+'%', background: 'linear-gradient(90deg,#ffa502,#ff6b00)'}"></div></div>
          <span class="capsule-label">今年</span>
        </div>
      </div>
    </div>

    <!-- 社交链接 -->
    <div class="social-grid">
      <a v-for="s in store.socials" :key="s.id" :href="s.url" target="_blank" class="social-card" :style="{'--c': s.color}">
        <svg v-if="s.icon === 'github'" class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
        </svg>
        <svg v-else-if="s.icon === 'mail'" class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4.5 6.5h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m3.2 7.4 7.35 5.65a2.35 2.35 0 0 0 2.9 0L20.8 7.4" />
        </svg>
        <svg v-else class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.5 14.5 14.5 9m-7.8 8.3-1 1a3.25 3.25 0 0 1-4.6-4.6l3.1-3.1a3.25 3.25 0 0 1 4.6 0m6.4 2.8a3.25 3.25 0 0 0 4.6 0l3.1-3.1a3.25 3.25 0 0 0-4.6-4.6l-1 1a3.25 3.25 0 0 0 0 4.6" />
        </svg>
        <span class="social-name">{{ s.name }}</span>
      </a>
    </div>

    <!-- 作品（左栏底部） -->
    <LinksWidget />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mainStore } from '../store'
import LinksWidget from '../components/widgets/LinksWidget.vue'

const store = mainStore()
const showSettings = ref(false)

// 响应式读取站点配置
const siteConfig = computed(() => store.config?.site || {})
const avatar = computed(() => siteConfig.value.avatar || '👤')
const siteTitle = computed(() => store.config?.site?.title || 'home')
const siteDomain = computed(() => store.config?.site?.domain ?? '')
const identity = computed(() => siteConfig.value.description?.identity || '全栈开发者')
const interests = computed(() => siteConfig.value.description?.interests || '科技 / AI / 代码')
const location = computed(() => siteConfig.value.description?.location || '')

// 更新日志
const changelog = computed(() => store.config?.changelog || [])

// 头像类型判断：支持 URL、Markdown ![](url)、Emoji
const avatarUrl = computed(() => {
  const a = avatar.value
  // Markdown 格式：![alt](url)
  const mdMatch = a.match(/!\[.*?\]\((.*?)\)/)
  if (mdMatch) return mdMatch[1]
  // 直接 URL
  if (a.startsWith('http://') || a.startsWith('https://') || a.startsWith('/')) return a
  return null
})
const avatarIsImage = computed(() => !!avatarUrl.value)

</script>

<style lang="scss" scoped>
.left {
  width: 50%;
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (max-width: 900px) { width: 100%; }
}

.profile-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--theme-primary);
    box-shadow: 0 8px 24px var(--theme-glow);
  }
}

.avatar-wrapper {
  position: relative;
  width: 50px;
  height: 50px;
}

.avatar-ring {  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--theme-primary), var(--theme-secondary), var(--theme-primary));
  animation: spin 3s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.avatar {
  position: absolute;
  inset: 3px;
  background: rgba(20,20,40,0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.avatar-img {
  position: absolute;
  inset: 3px;
  width: calc(100% - 6px);
  height: calc(100% - 6px);
  border-radius: 50%;
  object-fit: cover;
}

.profile-info { flex: 1; }

.logo-text {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 3px;
}

.main { font-size: 1.05rem; font-weight: 700; color: #fff; }
.sub { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
.profile-desc { font-size: 0.7rem; color: rgba(255,255,255,0.6); }

/* 翻转卡片 */
.flip-card-container {
  perspective: 1000px;
  height: 172px;
  cursor: pointer;
}

.flip-card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.flip-card.flipped { transform: rotateY(180deg); }

.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 16px;
  overflow: hidden;
}

.flip-front {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
}

.flip-back {
  background: rgba(10,10,30,0.95);
  border: 1px solid rgba(0,212,255,0.25);
  transform: rotateY(180deg);
}

.face-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(123,47,247,0.05) 100%);
}

.face-content {
  position: relative;
  padding: 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.face-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.face-icon { font-size: 15px; }
.face-title { font-size: 0.85rem; font-weight: 600; color: var(--theme-primary); flex: 1; }
.back-hint { font-size: 14px; opacity: 0.5; cursor: pointer; &:hover { opacity: 1; } }

.info-list { display: flex; flex-direction: column; gap: 6px; }
.info-row { display: flex; align-items: center; gap: 8px; }
.info-label { min-width: 40px; font-size: 0.65rem; color: rgba(255,255,255,0.5); padding: 2px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; text-align: center; }
.info-value { font-size: 0.75rem; color: rgba(255,255,255,0.9); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.flip-tip { margin-top: auto; font-size: 0.6rem; color: var(--theme-primary); opacity: 0.7; text-align: right; }

.changelog-list { display: flex; flex-direction: column; gap: 5px; flex: 1; overflow-y: auto; &::-webkit-scrollbar { width: 3px; } &::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.4); border-radius: 2px; } }
.cl-item { display: flex; align-items: center; gap: 6px; }
.cl-ver { font-size: 0.55rem; padding: 1px 5px; background: rgba(0,212,255,0.15); border: 1px solid rgba(0,212,255,0.3); border-radius: 3px; color: var(--theme-primary); white-space: nowrap; }
.cl-desc { font-size: 0.6rem; color: rgba(255,255,255,0.6); }

.settings-btn { margin-top: auto; padding: 5px 12px; background: rgba(0,212,255,0.15); border: 1px solid rgba(0,212,255,0.3); border-radius: 6px; color: var(--theme-primary); font-size: 0.65rem; cursor: pointer; transition: all 0.3s; &:hover { background: rgba(0,212,255,0.25); } }

/* 时间胶囊 */
.capsule-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 14px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--theme-primary);
    box-shadow: 0 8px 24px var(--theme-glow);
  }
}

.capsule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.capsule-title { font-size: 0.8rem; font-weight: 600; color: var(--theme-primary); }
.site-days { font-size: 0.65rem; color: rgba(255,255,255,0.5); }

.capsule-bars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

.capsule-item { display: flex; flex-direction: column; gap: 4px; }
.capsule-top { display: flex; justify-content: space-between; align-items: center; }
.capsule-icon { font-size: 12px; }
.capsule-val { font-size: 0.7rem; font-weight: 600; color: rgba(255,255,255,0.9); }
.capsule-bar { height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
.capsule-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.capsule-label { font-size: 0.55rem; color: rgba(255,255,255,0.4); text-align: center; }

/* 社交网格 */
.social-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

.social-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px 6px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--c);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }

  &:active { transform: scale(0.95); }
}

.social-icon {
  width: 21px;
  height: 21px;
  color: var(--c);
  filter: drop-shadow(0 0 7px color-mix(in srgb, var(--c) 45%, transparent));
  transition: transform 0.3s ease, filter 0.3s ease;
}
.social-card:hover .social-icon {
  transform: translateY(-1px) scale(1.12);
  filter: drop-shadow(0 0 10px var(--c));
}
.social-name { font-size: 0.6rem; color: rgba(255,255,255,0.7); text-align: center; }
</style>
