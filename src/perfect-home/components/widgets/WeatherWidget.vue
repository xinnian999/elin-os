<template>
  <div class="widget weather-widget" @click="store.fetchWeather" title="点击刷新天气">
    <div class="widget-header">
      <span class="widget-icon">{{ store.weather?.icon || '🌤️' }}</span>
      <span class="widget-title">天气</span>
      <div class="weather-actions">
        <span class="update-time" v-if="store.weather">刚刚更新</span>
        <button class="refresh-btn" @click.stop="store.fetchWeather">🔄</button>
      </div>
    </div>
    <div class="weather-content" v-if="store.weather">
      <div class="weather-main">
        <span class="weather-icon" :class="{ 'icon-animate': isNight }">{{ store.weather.icon }}</span>
        <div class="weather-temp">
          <span class="temp-value">{{ store.weather.temp }}</span>
          <span class="temp-unit">°C</span>
        </div>
      </div>
      <div class="weather-info">
        <div class="weather-text">{{ store.weather.text }}</div>
        <div class="weather-city">📍 {{ store.weather.city }}</div>
      </div>
      <div class="weather-details" v-if="store.weather.humidity || store.weather.wind">
        <div class="detail-item" v-if="store.weather.humidity">
          <span class="detail-icon">💧</span>
          <span class="detail-value">{{ store.weather.humidity }}%</span>
        </div>
        <div class="detail-item" v-if="store.weather.wind">
          <span class="detail-icon">🌬️</span>
          <span class="detail-value">{{ store.weather.wind }} km/h</span>
        </div>
      </div>
    </div>
    <div class="loading" v-else-if="store.weatherLoading">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载天气中...</span>
    </div>
    <div class="error" v-else>
      <span class="error-icon">🌧️</span>
      <span class="error-text">天气加载失败</span>
      <button class="retry-btn" @click="store.fetchWeather">重试</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { mainStore } from '../../store'
const store = mainStore()
const isNight = computed(() => {
  const h = new Date().getHours()
  return h < 6 || h >= 18
})
</script>

<style lang="scss" scoped>
.weather-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 14px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.15);
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex: 0 0 auto;
}

.widget-icon {
  font-size: 16px;
}

.widget-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #00d4ff;
}

.weather-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-time {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
}

.refresh-btn {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.3);
    transform: rotate(180deg);
  }
}

.weather-content {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 7px;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weather-icon {
  width: 46px;
  flex: 0 0 46px;
  font-size: 42px;
  line-height: 1;
  text-align: center;
  transition: transform 0.3s ease;

  &.icon-animate {
    animation: float 3s ease-in-out infinite;
  }

  &:hover {
    transform: scale(1.1);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.weather-temp {
  display: flex;
  align-items: flex-start;
}

.temp-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.temp-unit {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.weather-info {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.weather-text {
  flex: 0 0 auto;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.weather-city {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);

  &::before {
    content: '';
  }
}

.weather-details {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: auto;
  padding-top: 7px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-icon {
  font-size: 0.8rem;
}

.detail-value {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  gap: 12px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  gap: 8px;
}

.error-icon {
  font-size: 32px;
  opacity: 0.5;
}

.error-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.retry-btn {
  margin-top: 8px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
    border-color: rgba(0, 212, 255, 0.4);
  }
}
</style>
