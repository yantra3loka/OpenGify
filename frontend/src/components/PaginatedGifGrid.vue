<template>
  <div>
    <div v-if="query.isPending.value" class="columns-2 gap-4 sm:columns-3 lg:columns-4" aria-label="Loading">
      <div
        v-for="n in 8"
        :key="n"
        class="mb-4 h-48 animate-pulse break-inside-avoid rounded-xl bg-slate-200"
      />
    </div>

    <div v-else-if="query.isError.value" class="py-16 text-center">
      <p class="text-slate-600">Couldn't load GIFs: {{ errorMessage }}</p>
      <button
        type="button"
        class="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        @click="() => query.refetch()"
      >
        Retry
      </button>
    </div>

    <template v-else>
      <GifGrid v-if="items.length > 0" :gifs="items" />
      <div v-else class="py-16 text-center text-slate-500">
        <slot name="empty">
          <p>No GIFs found.</p>
        </slot>
      </div>
      <div ref="sentinel" class="h-2" aria-hidden="true" />
      <p v-if="query.isFetchingNextPage.value" class="py-4 text-center text-sm text-slate-500">
        Loading more…
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InfiniteData, UseInfiniteQueryReturnType } from '@tanstack/vue-query'
import { getApiErrorMessage } from '@/api/client'
import type { GifPage } from '@/api/types'
import GifGrid from '@/components/GifGrid.vue'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'

const props = defineProps<{
  query: UseInfiniteQueryReturnType<InfiniteData<GifPage, unknown>, Error>
}>()

const items = computed(
  () => props.query.data.value?.pages.flatMap((p) => p.items) ?? [],
)
const errorMessage = computed(() => getApiErrorMessage(props.query.error.value))

const sentinel = ref<HTMLElement | null>(null)
useInfiniteScroll(sentinel, () => {
  if (props.query.hasNextPage.value && !props.query.isFetching.value) {
    void props.query.fetchNextPage()
  }
})
</script>
