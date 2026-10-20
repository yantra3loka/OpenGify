<template>
  <div class="columns-2 gap-5 min-[900px]:columns-3 min-[1240px]:columns-4">
    <GifCard v-for="gif in gifs" :key="gif.id" :gif="gif" />
  </div>
</template>

<script setup lang="ts">
import type { GifPublic } from '@/api/types'
import GifCard from '@/components/GifCard.vue'

defineProps<{ gifs: GifPublic[] }>()
</script>
