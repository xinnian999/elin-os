<template>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      v-if="icon.mode === 'stroke'"
      :d="icon.path"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path v-else :d="icon.path" fill="currentColor" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { CONTACT_ICON_MAP } from '../utils/contact-presets'

const props = defineProps({ name: { type: String, required: true } })
const icon = computed(() => CONTACT_ICON_MAP[props.name] || CONTACT_ICON_MAP.website)
</script>
