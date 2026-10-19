<template>
  <div class="px-4 py-6">
    <SearchBar class="mx-auto" />
    <h1 class="mt-6 text-xl font-bold text-slate-900">Latest GIFs</h1>
    <PaginatedGifGrid :query="feed" class="mt-4">
      <template #empty>
        <p>No GIFs yet.</p>
        <RouterLink to="/upload" class="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-500">
          Be the first to upload one →
        </RouterLink>
      </template>
    </PaginatedGifGrid>
  </div>
</template>

<script setup lang="ts">
import { useGifFeed } from '@/api/queries'
import PaginatedGifGrid from '@/components/PaginatedGifGrid.vue'
import SearchBar from '@/components/SearchBar.vue'

const feed = useGifFeed()
</script>
