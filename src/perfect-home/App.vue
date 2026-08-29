<template>
  <div class="app" @mousemove="store.updateMouse">
    <!-- 自定义鼠标 -->
    <CustomCursor />
    <!-- 公告栏 -->
    <Announcement />

    <!-- Loading Screen -->
    <LoadingScreen />

    <!-- Background -->
    <Background :auto-switch-paused="showConfigEditor" />

    <!-- Main Content -->
    <main id="main" v-if="store.imgLoadStatus">
      <!-- 打字机标语 -->
      <TypewriterBanner />
      <div class="container">
        <!-- Left Column -->
        <MainLeft />
        <!-- Right Column -->
        <MainRight />
      </div>

      <!-- Mobile Menu -->
      <div class="mobile-menu" v-if="isMobile" @click="toggleMobile">
        <span>{{ mobileOpen ? '✕' : '☰' }}</span>
      </div>
    </main>

    <!-- Settings Panel -->
    <SettingsPanel v-if="store.setOpenState" />

    <!-- Footer -->
    <Footer @open-config="showConfigEditor = true" />

    <!-- perfect-home 原生编辑入口，数据保存到 Cloudflare KV -->
    <ConfigEditor v-if="showConfigEditor && store.config" @close="showConfigEditor = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { mainStore } from './store'
import { loadConfig } from './utils/config'
import { initSecurityFeatures, initDataIntegrity } from './utils/security'
import Announcement from './components/Announcement.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import Background from './components/Background.vue'
import MainLeft from './views/MainLeft.vue'
import MainRight from './views/MainRight.vue'
import SettingsPanel from './views/SettingsPanel.vue'
import Footer from './components/Footer.vue'
import TypewriterBanner from './components/TypewriterBanner.vue'
import CustomCursor from './components/CustomCursor.vue'
import ConfigEditor from './components/ConfigEditor.vue'

const store = mainStore()
const mobileOpen = ref(false)
const config = ref(null)
const showConfigEditor = ref(false)

const isMobile = computed(() => store.innerWidth < 720)

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
}

const syncInnerWidth = () => store.setInnerWidth(window.innerWidth)

onMounted(async () => {
  // 加载配置文件
  config.value = await loadConfig()

  // 初始化安全防护
  if (config.value?.security?.disableRightClick || config.value?.security?.disableDevTools || config.value?.security?.disableSourceView) {
    initSecurityFeatures(config.value)
    initDataIntegrity(config.value)
  }

  // 保存配置到store
  store.setConfig(config.value)

  // 初始化主题（应用保存的主题）
  store.setTheme(store.activeTheme)

  syncInnerWidth()
  window.addEventListener('resize', syncInnerWidth)
  // 两项数据均由同源 Worker 基于当前 Cloudflare 请求位置获取
  await Promise.allSettled([store.fetchVisitor(), store.fetchWeather()])
})

onUnmounted(() => {
  window.removeEventListener('resize', syncInnerWidth)
})

// 监听站点标题变化，同步更新浏览器标签页标题
watch(
  () => store.config?.site?.title,
  (title) => {
    if (title) {
      document.title = title + store.config?.site?.domain
    }
  },
  { immediate: true }
)
</script>

<style lang="scss">
.app {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

#main {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s;
  padding-top: 40px;
}

.container {
  width: 100%;
  flex: 1;
  min-height: 0;
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 20px 14px;
  display: flex;
  align-items: stretch;
  gap: 20px;

  @media (max-width: 900px) {
    flex-direction: column;
    flex: none;
    min-height: auto;
    padding-top: 80px;
    padding-bottom: 60px;
  }
}

@media (max-width: 900px) {
  .app {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  #main {
    min-height: 100vh;
    display: block;
  }
}

.mobile-menu {
  display: none;
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  z-index: 100;
  cursor: pointer;

  @media (max-width: 900px) {
    display: flex;
  }
}

</style>
