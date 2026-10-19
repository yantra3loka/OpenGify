<template>
  <RouterLink
    :to="{ name: 'search', query: { q: tag, tag } }"
    class="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-indigo-100 hover:text-indigo-700"
    @click.stop
  >
    #{{ tag }}
  </RouterLink>
</template>

<script setup lang="ts">
defineProps<{ tag: string }>()
</script>
