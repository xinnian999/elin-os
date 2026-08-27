<template>
  <div class="right">
    <!-- 上方 2x3 网格 -->
    <div class="top-widgets">
      <ClockWidget />
      <WeatherWidget />
      <VisitorWidget />
      <WoodenFishWidget />
      <HitokotoWidget />
      <CountdownWidget />
    </div>

    <!-- 中间 2x2：番茄钟 + 快捷便签 -->
    <div class="middle-widgets">
      <PomodoroWidget />
      <QuickNotesWidget />
    </div>

    <!-- 底部：待办 + GitHub贡献图 -->
    <div class="bottom-section">
      <TodoWidget />
      <GithubContribWidget />
    </div>

    <!-- 项目链接（独占一行） -->
    <LinksWidget />
  </div>
</template>

<script setup>
import { mainStore } from '../store'
import ClockWidget from '../components/widgets/ClockWidget.vue'
import WeatherWidget from '../components/widgets/WeatherWidget.vue'
import VisitorWidget from '../components/widgets/VisitorWidget.vue'
import HitokotoWidget from '../components/widgets/HitokotoWidget.vue'
import CountdownWidget from '../components/widgets/CountdownWidget.vue'
import WoodenFishWidget from '../components/widgets/WoodenFishWidget.vue'
import TodoWidget from '../components/widgets/TodoWidget.vue'
import QuickNotesWidget from '../components/widgets/QuickNotesWidget.vue'
import PomodoroWidget from '../components/widgets/PomodoroWidget.vue'
import LinksWidget from '../components/widgets/LinksWidget.vue'
import GithubContribWidget from '../components/widgets/GithubContribWidget.vue'

const store = mainStore()
</script>

<style lang="scss" scoped>
.right {
  width: 50%;
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 16px;
  min-height: calc(100vh - 40px);

  @media (max-width: 900px) {
    width: 100%;
    min-height: auto;
  }
}

// 上方 2x3 网格
.top-widgets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

// 中间 2x2
.middle-widgets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

// 底部 2列
.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}
</style>
