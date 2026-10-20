<template>
  <div class="flex items-center gap-1" role="group" aria-label="Colour theme">
    <button
      v-for="theme in themes"
      :key="theme.id"
      type="button"
      class="theme-dot"
      :class="{ 'theme-dot-active': current === theme.id }"
      :title="theme.label"
      :aria-label="`${theme.label} theme`"
      :aria-pressed="current === theme.id"
      @click="setTheme(theme.id)"
    >
      <span
        class="theme-dot-swatch"
        :style="{
          background: `linear-gradient(135deg, ${theme.bg} 0 50%, ${theme.accent} 50% 100%)`,
        }"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { themes, current, setTheme } = useTheme()
</script>
