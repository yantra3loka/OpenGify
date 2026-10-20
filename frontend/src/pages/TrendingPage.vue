<template>
  <div class="px-4 py-6">
    <h1 class="text-2xl font-extrabold tracking-tight text-ink">Trending</h1>
    <p class="mt-1 text-sm text-ink-soft">The most-liked GIFs right now.</p>
    <PaginatedGifGrid :query="trending" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import { useTrendingGifs } from '@/api/queries'
import PaginatedGifGrid from '@/components/PaginatedGifGrid.vue'

const trending = useTrendingGifs()
</script>
