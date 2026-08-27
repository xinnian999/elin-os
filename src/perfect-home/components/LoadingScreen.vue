<template>
  <div class="loading" :class="{ hidden: !visible }">
    <div class="loader">
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
      <div class="loader-logo">
        <span class="main-text">主页</span>
      </div>
    </div>
    <div class="loader-text">正在加载...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const visible = ref(true)

onMounted(() => {
  setTimeout(() => {
    visible.value = false
  }, 1500)
})
</script>

<style lang="scss" scoped>
.loading {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: opacity 0.5s, visibility 0.5s;

  &.hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
}

.loader {
  position: relative;
  width: 120px;
  height: 120px;
}

.loader-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;

  &:nth-child(1) {
    border-top-color: #00d4ff;
  }
  &:nth-child(2) {
    inset: 8px;
    border-top-color: #7b2ff7;
    animation-delay: -0.4s;
  }
  &:nth-child(3) {
    inset: 16px;
    border-top-color: #ff0089;
    animation-delay: -0.8s;
  }
}

.loader-logo {
  position: absolute;
  inset: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 50%;

  .main-text {
    font-family: 'HarmonyOS Sans', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #00d4ff;
    letter-spacing: 4px;
  }
}

.loader-text {
  margin-top: 30px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  letter-spacing: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
