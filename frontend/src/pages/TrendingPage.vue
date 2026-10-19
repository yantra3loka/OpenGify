<template>
  <div class="px-4 py-6">
    <h1 class="text-xl font-bold text-slate-900">Trending</h1>
    <p class="mt-1 text-sm text-slate-500">The most-liked GIFs right now.</p>
    <PaginatedGifGrid :query="trending" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import { useTrendingGifs } from '@/api/queries'
import PaginatedGifGrid from '@/components/PaginatedGifGrid.vue'

const trending = useTrendingGifs()
</script>
