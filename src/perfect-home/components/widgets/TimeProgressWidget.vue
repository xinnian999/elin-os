<template>
  <div class="widget timeprogress-widget">
    <div class="widget-header">
      <span class="widget-icon">⏳</span>
      <span class="widget-title">时光进度</span>
    </div>
    <div class="progress-list">
      <div class="progress-item">
        <div class="progress-label">
          <span>今日</span>
          <span class="val">{{ store.dayProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: store.dayProgress + '%' }"></div>
        </div>
      </div>
      <div class="progress-item">
        <div class="progress-label">
          <span>本周</span>
          <span class="val">{{ store.weekProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: store.weekProgress + '%' }"></div>
        </div>
      </div>
      <div class="progress-item">
        <div class="progress-label">
          <span>本月</span>
          <span class="val">{{ store.monthProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: store.monthProgress + '%' }"></div>
        </div>
      </div>
      <div class="progress-item">
        <div class="progress-label">
          <span>今年</span>
          <span class="val">{{ store.yearProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: store.yearProgress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { mainStore } from '../../store'
const store = mainStore()
</script>

<style lang="scss" scoped>
.timeprogress-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  min-height: 140px;
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

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);

  .val {
    color: #00d4ff;
    font-weight: 600;
  }
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #7b2ff7);
  border-radius: 3px;
  transition: width 0.8s ease;
}
</style>
