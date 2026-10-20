<template>
  <div
    class="pointer-events-none fixed bottom-6 right-6 z-50 flex w-72 flex-col gap-2"
    aria-live="polite"
  >
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast-item pointer-events-auto flex items-start gap-2.5 px-4 py-3 text-sm font-medium"
    >
      <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      <span class="flex-1">{{ t.message }}</span>
      <button
        type="button"
        class="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss notification"
        @click="dismiss(t.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>
