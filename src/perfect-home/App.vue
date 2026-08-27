<template>
  <div class="app" @mousemove="store.updateMouse">
    <!-- 自定义鼠标 -->
    <CustomCursor />
    <!-- 公告栏 -->
    <Announcement />

    <!-- Loading Screen -->
    <LoadingScreen />

    <!-- Background -->
    <Background />

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

    <!-- Music Player Panel -->
    <MusicPanel v-if="store.musicOpenState" />

    <!-- Music Player Enhanced -->
    <MusicPlayerEnhanced v-if="showMusicPlayer" @close="showMusicPlayer = false" />

    <!-- Music Player Toggle Button -->
    <button
      v-if="store.config?.music?.enabled"
      class="music-toggle-btn"
      @click="showMusicPlayer = !showMusicPlayer"
      :title="showMusicPlayer ? '关闭音乐' : '打开音乐'"
    >
      🎵
    </button>

    <!-- Footer -->
    <Footer />

    <!-- perfect-home 原生编辑入口，数据保存到 Cloudflare KV -->
    <ConfigEditor v-if="showConfigEditor" @close="showConfigEditor = false" />
    <button class="config-float-btn" @click="showConfigEditor = true" title="在线编辑">⚙️</button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { mainStore } from './store'
import { loadConfig } from './utils/config'
import { initSecurityFeatures, initDataIntegrity } from './utils/security'
import Announcement from './components/Announcement.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import Background from './components/Background.vue'
import MainLeft from './views/MainLeft.vue'
import MainRight from './views/MainRight.vue'
import SettingsPanel from './views/SettingsPanel.vue'
import MusicPanel from './components/MusicPanel.vue'
import Footer from './components/Footer.vue'
import TypewriterBanner from './components/TypewriterBanner.vue'
import CustomCursor from './components/CustomCursor.vue'
import MusicPlayerEnhanced from './components/MusicPlayerEnhanced.vue'
import ConfigEditor from './components/ConfigEditor.vue'

const store = mainStore()
const mobileOpen = ref(false)
const config = ref(null)
const showMusicPlayer = ref(false)
const showConfigEditor = ref(false)

const isMobile = computed(() => store.innerWidth < 720)

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
}

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

  store.setInnerWidth(window.innerWidth)
  window.addEventListener('resize', () => store.setInnerWidth(window.innerWidth))
  // 先获取访客信息（含城市），再用城市获取天气，避免重复请求 IP API
  await store.fetchVisitor()
  store.fetchWeather()
  store.fetchHitokoto()
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
  min-height: 100vh;
}

#main {
  position: relative;
  width: 100%;
  min-height: 100vh;
  transition: transform 0.3s;
  padding-top: 40px;
}

.container {
  width: 100%;
  min-height: calc(100vh - 40px);
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;

  @media (max-width: 900px) {
    flex-direction: column;
    min-height: auto;
    padding-top: 80px;
    padding-bottom: 60px;
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

.config-float-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  z-index: 99;
  transition: all 0.3s ease;

  &:hover {
    background: var(--theme-gradient);
    transform: scale(1.1);
    box-shadow: 0 4px 20px var(--theme-glow);
  }
}

.music-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  z-index: 99;
  transition: all 0.3s ease;

  &:hover {
    background: var(--theme-gradient);
    transform: scale(1.1);
    box-shadow: 0 4px 20px var(--theme-glow);
  }
}
</style>
