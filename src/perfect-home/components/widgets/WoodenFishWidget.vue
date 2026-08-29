<template>
  <div
    class="widget wooden-fish-widget"
    :class="{ striking }"
    role="button"
    tabindex="0"
    :aria-label="`敲木鱼，当前累计功德 ${merit}`"
    @click="strike"
    @keydown.enter.prevent="strike"
    @keydown.space.prevent="strike"
  >
    <div class="widget-header">
      <span class="widget-icon">◉</span>
      <span class="widget-title">敲木鱼</span>
      <span class="merit-total">功德 {{ merit }}</span>
    </div>

    <div class="fish-stage" aria-hidden="true">
      <span v-if="showMerit" :key="strikeId" class="merit-pop">功德 +1</span>
      <div class="mallet">
        <span class="mallet-head"></span>
        <span class="mallet-handle"></span>
      </div>
      <div class="wooden-fish">
        <span class="fish-groove groove-one"></span>
        <span class="fish-groove groove-two"></span>
        <span class="fish-eye"></span>
        <span class="fish-mouth"></span>
      </div>
    </div>

    <div class="fish-copy">
      <span class="chant">{{ chant }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const STORAGE_KEY = 'elinWoodenFishMerit'
const chants = ['烦恼 -1', '平心静气', '诸事顺意', '今日精进', '保持专注']
const savedMerit = Number.parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
const merit = ref(Number.isFinite(savedMerit) ? savedMerit : 0)
const chant = ref('轻敲木鱼，积攒功德')
const striking = ref(false)
const showMerit = ref(false)
const strikeId = ref(0)

let animationTimer = null
let meritTimer = null
let audioContext = null

const playKnock = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return
  if (!audioContext) audioContext = new AudioContext()

  const now = audioContext.currentTime
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(230, now)
  oscillator.frequency.exponentialRampToValueAtTime(105, now + 0.12)
  gain.gain.setValueAtTime(0.22, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.15)
}

const strike = () => {
  merit.value += 1
  localStorage.setItem(STORAGE_KEY, String(merit.value))
  chant.value = chants[(merit.value - 1) % chants.length]
  strikeId.value += 1
  showMerit.value = true
  striking.value = false
  playKnock()
  navigator.vibrate?.(18)

  clearTimeout(animationTimer)
  clearTimeout(meritTimer)
  requestAnimationFrame(() => { striking.value = true })
  animationTimer = setTimeout(() => { striking.value = false }, 260)
  meritTimer = setTimeout(() => { showMerit.value = false }, 650)
}

onUnmounted(() => {
  clearTimeout(animationTimer)
  clearTimeout(meritTimer)
  audioContext?.close()
})
</script>

<style lang="scss" scoped>
.wooden-fish-widget {
  --wood-light: #d89652;
  --wood-mid: #a9552f;
  --wood-dark: #572517;
  position: relative;
  min-height: 188px;
  padding: 16px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  background:
    radial-gradient(circle at 50% 58%, rgba(226, 144, 75, 0.12), transparent 45%),
    rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-3px);
    border-color: rgba(226, 144, 75, 0.72);
    box-shadow: 0 8px 24px rgba(170, 85, 47, 0.24);
    outline: none;
  }

  &:active { transform: translateY(-1px) scale(0.99); }
}

.widget-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.widget-icon {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border: 1px solid rgba(226, 144, 75, 0.8);
  border-radius: 50%;
  color: #f1b16f;
  font-size: 9px;
}

.widget-title {
  color: #f1b16f;
  font-size: 0.85rem;
  font-weight: 600;
}

.merit-total {
  margin-left: auto;
  padding: 3px 8px;
  border: 1px solid rgba(226, 144, 75, 0.2);
  border-radius: 999px;
  background: rgba(87, 37, 23, 0.25);
  color: rgba(255, 226, 194, 0.76);
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
}

.fish-stage {
  position: relative;
  display: grid;
  height: 102px;
  place-items: center;
}

.wooden-fish {
  position: relative;
  width: 116px;
  height: 68px;
  margin-top: 20px;
  border: 1px solid rgba(255, 202, 148, 0.42);
  border-radius: 48% 52% 44% 56% / 56% 60% 40% 44%;
  background:
    radial-gradient(circle at 35% 25%, rgba(255, 219, 171, 0.42), transparent 24%),
    linear-gradient(145deg, var(--wood-light) 0%, var(--wood-mid) 51%, var(--wood-dark) 100%);
  box-shadow:
    inset -12px -12px 18px rgba(48, 16, 8, 0.34),
    inset 8px 7px 12px rgba(255, 216, 165, 0.16),
    0 14px 24px rgba(20, 8, 4, 0.34);
  transform-origin: 50% 80%;
}

.fish-eye {
  position: absolute;
  top: 16px;
  right: 24px;
  width: 8px;
  height: 8px;
  border: 2px solid rgba(65, 23, 12, 0.88);
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 204, 145, 0.45);
}

.fish-mouth {
  position: absolute;
  right: -2px;
  bottom: 17px;
  width: 43px;
  height: 14px;
  border-bottom: 5px solid rgba(56, 20, 10, 0.84);
  border-radius: 0 0 80% 20%;
  transform: rotate(-7deg);
}

.fish-groove {
  position: absolute;
  border: 2px solid rgba(78, 27, 13, 0.42);
  border-radius: 50%;
}

.groove-one { inset: 9px 48px 18px 13px; border-right: 0; }
.groove-two { inset: 20px 58px 8px 28px; border-right: 0; }

.mallet {
  position: absolute;
  z-index: 2;
  top: 1px;
  left: calc(50% + 24px);
  width: 75px;
  height: 25px;
  transform: rotate(-21deg);
  transform-origin: 100% 50%;
}

.mallet-head {
  position: absolute;
  left: 0;
  top: 4px;
  width: 24px;
  height: 18px;
  border-radius: 48%;
  background: linear-gradient(145deg, #c97943, #70331e);
  box-shadow: inset 3px 3px 5px rgba(255, 210, 155, 0.24), 0 4px 8px rgba(0, 0, 0, 0.24);
}

.mallet-handle {
  position: absolute;
  top: 11px;
  left: 20px;
  width: 55px;
  height: 5px;
  border-radius: 99px;
  background: linear-gradient(90deg, #9d4b2c, #d29357);
}

.merit-pop {
  position: absolute;
  z-index: 3;
  top: 12px;
  left: 50%;
  color: #ffd49d;
  font-size: 0.78rem;
  font-weight: 700;
  text-shadow: 0 0 14px rgba(255, 174, 93, 0.8);
  animation: merit-rise 0.65s ease-out both;
}

.striking {
  .wooden-fish { animation: fish-knock 0.26s ease-out; }
  .mallet { animation: mallet-knock 0.26s ease-out; }
}

.fish-copy {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.chant { color: rgba(255, 235, 211, 0.9); font-size: 0.78rem; }
@keyframes fish-knock {
  0%, 100% { transform: scale(1); }
  36% { transform: scale(0.94) rotate(-1deg); }
  68% { transform: scale(1.04) rotate(1deg); }
}

@keyframes mallet-knock {
  0%, 100% { transform: rotate(-21deg); }
  38% { transform: rotate(-48deg) translate(-2px, 8px); }
}

@keyframes merit-rise {
  from { opacity: 0; transform: translate(-50%, 8px) scale(0.9); }
  30% { opacity: 1; }
  to { opacity: 0; transform: translate(-50%, -25px) scale(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  .wooden-fish-widget, .wooden-fish, .mallet, .merit-pop { animation: none !important; transition: none !important; }
}

@media (min-width: 901px) {
  .wooden-fish-widget {
    display: flex;
    flex-direction: column;
  }

  .widget-header {
    flex: 0 0 auto;
  }

  .fish-stage {
    margin-top: auto;
  }

  .fish-copy {
    margin-bottom: auto;
  }
}
</style>
