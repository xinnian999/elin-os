<template>
  <div class="settings-panel" @click.self="store.setOpenState = false">
    <div class="panel-content">
      <!-- 左侧 -->
      <div class="panel-left">
        <div class="logo-section">
          <div class="domain-logo">
            <span class="main">{{ store.config?.site?.title || '主页' }}</span>
            <span class="sub">{{ store.config?.site?.domain || '.example' }}</span>
          </div>
          <div class="version">{{ version }}</div>
        </div>

        <div class="changelog">
          <div class="changelog-title">📝 更新日志</div>
          <div class="changelog-list">
            <div class="changelog-item" v-for="(item, i) in changelog" :key="i">
              <span class="version-tag">{{ item.version }}</span>
              <span class="version-desc">{{ item.desc }}</span>
            </div>
          </div>
        </div>

        <div class="github-link">
          <a href="https://github.com/327261086/perfect-home" target="_blank">
            <span>⬛</span> 查看 GitHub 项目
          </a>
        </div>
      </div>

      <!-- 右侧 -->
      <div class="panel-right">
        <div class="panel-header">
          <span class="panel-title">⚙️ 全局设置</span>
          <button class="close-btn" @click="store.setOpenState = false">✕</button>
        </div>

        <!-- 一级菜单 -->
        <div class="menu-tabs">
          <button
            v-for="menu in menus"
            :key="menu.id"
            :class="{ active: store.activeMenu === menu.id }"
            @click="store.activeMenu = menu.id"
          >
            {{ menu.icon }} {{ menu.name }}
          </button>
        </div>

        <!-- 菜单内容 -->
        <div class="menu-content">
          <!-- 个性壁纸 -->
          <div v-if="store.activeMenu === 'wallpaper'" class="menu-section">
            <BackgroundManager />
          </div>

          <!-- 个性化调整 -->
          <div v-if="store.activeMenu === 'personalize'" class="menu-section">
            <div class="setting-item">
              <span class="setting-label">主题模式</span>
              <div class="theme-options">
                <button
                  v-for="theme in themes"
                  :key="theme.value"
                  :class="{ active: store.themeMode === theme.value }"
                  @click="setTheme(theme.value)"
                >
                  {{ theme.icon }} {{ theme.label }}
                </button>
              </div>
            </div>
            <div class="setting-item">
              <span class="setting-label">配色方案</span>
              <div class="color-themes">
                <button
                  v-for="(c, key) in store.themes"
                  :key="key"
                  :class="['color-btn', { active: store.activeTheme === key }]"
                  :style="{ background: c.gradient }"
                  :title="c.name"
                  @click="store.setTheme(key)"
                >
                  <span class="color-name">{{ c.name }}</span>
                </button>
              </div>
            </div>
            <div class="setting-item">
              <span class="setting-label">音乐点击打开面板</span>
              <label class="toggle">
                <input type="checkbox" v-model="store.musicClick" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <span class="setting-label">粒子背景特效</span>
              <label class="toggle">
                <input type="checkbox" :checked="store.particlesEnabled" @change="store.setParticlesEnabled($event.target.checked)" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <span class="setting-label">自定义鼠标特效</span>
              <label class="toggle">
                <input type="checkbox" :checked="store.customCursorEnabled" @change="store.setCustomCursorEnabled($event.target.checked)" />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <!-- 播放器配置 -->
          <div v-if="store.activeMenu === 'player'" class="menu-section">
            <div class="setting-item">
              <span class="setting-label">自动播放</span>
              <label class="toggle">
                <input type="checkbox" v-model="store.playerAutoplay" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <span class="setting-label">随机播放</span>
              <label class="toggle">
                <input type="checkbox" v-model="store.playerOrder" :true-value="'random'" :false-value="'list'" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <span class="setting-label">循环模式</span>
              <div class="loop-options">
                <button
                  v-for="loop in loops"
                  :key="loop.value"
                  :class="{ active: store.playerLoop === loop.value }"
                  @click="store.playerLoop = loop.value"
                >
                  {{ loop.label }}
                </button>
              </div>
            </div>
            <div class="setting-item">
              <span class="setting-label">音量</span>
              <input type="range" min="0" max="1" step="0.1" v-model="store.musicVolume" class="volume-slider" />
            </div>
          </div>

          <!-- 其他设置 -->
          <div v-if="store.activeMenu === 'other'" class="menu-section">
            <div class="setting-item">
              <span class="setting-label">语言 / Language</span>
              <div class="language-options">
                <button
                  :class="{ active: store.language === 'zh' }"
                  @click="setLanguage('zh')"
                >
                  🇨🇳 中文
                </button>
                <button
                  :class="{ active: store.language === 'en' }"
                  @click="setLanguage('en')"
                >
                  🇺🇸 English
                </button>
              </div>
            </div>
            <div class="setting-item">
              <span class="setting-label">便签板</span>
              <label class="toggle">
                <input type="checkbox" v-model="store.notesEnabled" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <span class="setting-label">底栏歌词显示</span>
              <label class="toggle">
                <input type="checkbox" v-model="store.playerLrcShow" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { mainStore } from '../store'
import BackgroundManager from '../components/BackgroundManager.vue'

const store = mainStore()

const version = 'v1.3.0'
const changelog = computed(() => store.config?.changelog || [])

const setLanguage = (lang) => {
  store.setLanguage(lang)
}

const menus = [
  { id: 'wallpaper', name: '个性壁纸', icon: '🖼️' },
  { id: 'personalize', name: '个性化调整', icon: '🎨' },
  { id: 'player', name: '播放器配置', icon: '🎵' },
  { id: 'other', name: '其他设置', icon: '⚡' }
]

const wallpapers = [
  { value: 'default', label: '默认壁纸', icon: '🖼️' },
  { value: 'daily', label: '每日一图', icon: '📅' },
  { value: 'random-scenery', label: '随机风景', icon: '🏔️' },
  { value: 'random-anime', label: '随机动漫', icon: '🎨' }
]

const themes = [
  { value: 'auto', label: '自动', icon: '🔄' },
  { value: 'light', label: '白天', icon: '☀️' },
  { value: 'dark', label: '黑夜', icon: '🌙' }
]

const loops = [
  { value: 'all', label: '列表循环' },
  { value: 'one', label: '单曲循环' },
  { value: 'none', label: '不循环' }
]

const setTheme = (mode) => {
  store.themeMode = mode
  localStorage.setItem('themeMode', mode)
  applyTheme(mode)
}

const applyTheme = (mode) => {
  const body = document.body
  body.classList.remove('theme-light', 'theme-dark', 'theme-auto')

  if (mode === 'auto') {
    const h = new Date().getHours()
    const isNight = h < 6 || h >= 18
    body.classList.add(isNight ? 'theme-dark' : 'theme-light')
  } else {
    body.classList.add(`theme-${mode}`)
  }
}

// 初始化主题
applyTheme(store.themeMode)
</script>

<style lang="scss" scoped>
.settings-panel {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.panel-content {
  display: flex;
  width: 90%;
  max-width: 900px;
  height: 80vh;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 24px;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    height: 90vh;
  }
}

.panel-left {
  width: 280px;
  padding: 30px;
  background: rgba(0, 0, 0, 0.3);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;
    padding: 20px;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.domain-logo {
  font-family: 'HarmonyOS Sans', sans-serif;
  font-size: 2rem;
  margin-bottom: 12px;

  .main {
    color: #00d4ff;
    font-weight: 700;
  }

  .sub {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 300;
  }
}

.version {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 30px;
}

.changelog {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.changelog-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.changelog-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.4);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 212, 255, 0.6);
    }
  }
}

.changelog-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version-tag {
  padding: 4px 10px;
  background: rgba(0, 212, 255, 0.2);
  border-radius: 6px;
  font-size: 0.8rem;
  color: #00d4ff;
}

.version-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.github-link {
  margin-top: auto;

  a {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    transition: all 0.3s;

    &:hover {
      background: rgba(0, 0, 0, 0.5);
    }
  }
}

.panel-right {
  flex: 1;
  padding: 30px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 20px;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #00d4ff;
}

.close-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 0, 137, 0.3);
  }
}

.menu-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  button {
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(0, 212, 255, 0.1);
    }

    &.active {
      background: rgba(0, 212, 255, 0.2);
      border-color: #00d4ff;
      color: #00d4ff;
    }
  }
}

.menu-content {
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.3);
    border-radius: 2px;
  }
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-label {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
}

.wallpaper-options, .loop-options, .theme-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(0, 212, 255, 0.1);
    }

    &.active {
      background: rgba(0, 212, 255, 0.2);
      border-color: #00d4ff;
      color: #00d4ff;
    }
  }
}

.wallpaper-preview {
  display: flex;
  align-items: center;
  gap: 16px;

  img {
    width: 200px;
    height: 120px;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .preview-actions {
    display: flex;
    gap: 8px;

    button {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: rgba(0, 212, 255, 0.2);
      }
    }
  }
}

.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 28px;
    transition: all 0.3s;

    &::before {
      content: '';
      position: absolute;
      height: 22px;
      width: 22px;
      left: 3px;
      bottom: 3px;
      background: #fff;
      border-radius: 50%;
      transition: all 0.3s;
    }
  }

  input:checked + .slider {
    background: rgba(0, 212, 255, 0.5);
  }

  input:checked + .slider::before {
    transform: translateX(22px);
    background: #00d4ff;
  }
}

.date-input {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 0.9rem;

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
}

.volume-slider {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #00d4ff;
    border-radius: 50%;
    cursor: pointer;
  }
}

.color-themes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.color-btn {
  width: 80px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &.active {
    border-color: #fff;
    box-shadow: 0 0 20px var(--theme-glow);
  }
}

.color-name {
  font-size: 0.65rem;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  font-weight: 500;
}

.language-options {
  display: flex;
  gap: 8px;

  button {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(0, 212, 255, 0.1);
    }

    &.active {
      background: rgba(0, 212, 255, 0.2);
      border-color: var(--theme-primary);
      color: var(--theme-primary);
    }
  }
}
</style>
