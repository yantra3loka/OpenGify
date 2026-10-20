<template>
  <RouterLink
    :to="{ name: 'search', query: { q: tag, tag } }"
    class="tag-chip"
    @click.stop
  >
    #{{ tag }}
  </RouterLink>
</template>

<script setup lang="ts">
defineProps<{ tag: string }>()
</script>
