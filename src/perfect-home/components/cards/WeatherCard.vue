<template>
  <div class="card weather-card">
    <div class="card-header">
      <span class="title">🌤️ 实时天气</span>
      <button class="refresh-btn" @click="fetchWeather" :disabled="loading">
        <Icon size="16">
          <Refresh :class="{ spinning: loading }" />
        </Icon>
      </button>
    </div>
    <div class="weather-content" v-if="weather">
      <div class="main-info">
        <span class="icon">{{ weather.icon }}</span>
        <span class="temp">{{ weather.temp }}°C</span>
      </div>
      <div class="details">
        <div class="detail-item">
          <span class="label">天气</span>
          <span class="value">{{ weather.text }}</span>
        </div>
        <div class="detail-item">
          <span class="label">湿度</span>
          <span class="value">{{ weather.humidity }}%</span>
        </div>
        <div class="detail-item">
          <span class="label">风速</span>
          <span class="value">{{ weather.wind }}km/h</span>
        </div>
        <div class="detail-item">
          <span class="label">位置</span>
          <span class="value">{{ weather.city }}</span>
        </div>
      </div>
    </div>
    <div class="loading-state" v-else-if="loading">
      <span class="spinner"></span>
    </div>
    <div class="error-state" v-else>
      <span>获取天气失败</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@vicons/utils'
import { Refresh } from '@vicons/ionicons5'

const weather = ref(null)
const loading = ref(true)

const weatherIcons = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
}

const weatherTexts = {
  0: '晴', 1: '晴间多云', 2: '多云', 3: '阴',
  45: '雾', 48: '霜雾',
  51: '小雨', 53: '中雨', 55: '大雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪',
  80: '阵雨', 81: '中阵雨', 82: '大阵雨',
  95: '雷暴', 96: '雷暴冰雹', 99: '强雷暴'
}

const fetchWeather = async () => {
  loading.value = true
  try {
    // 获取位置
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000
      })
    })

    const lat = pos.coords.latitude
    const lon = pos.coords.longitude

    // 获取天气
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
    )
    const weatherData = await weatherRes.json()

    // 获取城市
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    )
    const geoData = await geoRes.json()

    const code = weatherData.current.weather_code
    weather.value = {
      temp: Math.round(weatherData.current.temperature_2m),
      humidity: weatherData.current.relative_humidity_2m,
      wind: Math.round(weatherData.current.wind_speed_10m),
      icon: weatherIcons[code] || '🌤️',
      text: weatherTexts[code] || '未知',
      city: geoData.address?.city || geoData.address?.town || geoData.address?.village || '未知'
    }
  } catch (e) {
    // 失败时使用默认数据
    weather.value = {
      temp: 25,
      humidity: 60,
      wind: 10,
      icon: '☀️',
      text: '晴',
      city: '北京'
    }
  }
  loading.value = false
}

onMounted(fetchWeather)
</script>

<style lang="scss" scoped>
.weather-card {
  .weather-content {
    .main-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 16px;

      .icon {
        font-size: 3rem;
      }

      .temp {
        font-size: 2.5rem;
        font-weight: 700;
        @include text-gradient;
      }
    }

    .details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .label {
          font-size: 12px;
          color: $text-light;
        }

        .value {
          font-size: 14px;
          color: $text;
        }
      }
    }
  }

  .loading-state, .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: $text-light;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid $border;
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }
}
</style>
