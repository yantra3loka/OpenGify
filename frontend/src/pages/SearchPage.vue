<template>
  <div class="px-4 py-6">
    <SearchBar :initial="q" class="mx-auto" />
    <h1 class="mt-6 text-2xl font-extrabold tracking-tight text-ink">
      <template v-if="tag">Tag: <span class="text-accent">#{{ tag }}</span></template>
      <template v-else-if="q">Results for “{{ q }}”</template>
      <template v-else>Search</template>
    </h1>
    <PaginatedGifGrid v-if="hasQuery" :query="search" class="mt-4">
      <template #empty>
        <p>No GIFs matched your search. Try another term or tag.</p>
      </template>
    </PaginatedGifGrid>
    <p v-else class="mt-4 text-sm text-ink-soft">
      Type above to search by title, description or tag.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGifSearch } from '@/api/queries'
import PaginatedGifGrid from '@/components/PaginatedGifGrid.vue'
import SearchBar from '@/components/SearchBar.vue'

const route = useRoute()
const q = computed(() => String(route.query.q ?? ''))
const tag = computed(() =>
  route.query.tag ? String(route.query.tag) : undefined,
)
const hasQuery = computed(() => q.value.trim().length > 0 || !!tag.value?.trim())

const search = useGifSearch(q, tag)
</script>
