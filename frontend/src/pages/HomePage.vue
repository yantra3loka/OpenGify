<template>
  <div class="px-4 pb-10">
    <!-- Hero -->
    <section class="pt-10">
      <h1
        class="max-w-2xl text-[clamp(30px,4.6vw,46px)] font-black leading-[1.05] tracking-tight text-ink"
      >
        Every reaction. One search away.
      </h1>
      <p class="mt-3 max-w-xl text-base text-ink-soft">
        Discover, share and embed the perfect GIF for any moment — uploaded by
        the OpenGIPHY community.
      </p>
      <dl class="mt-7 flex flex-wrap gap-x-10 gap-y-4">
        <div v-for="stat in stats" :key="stat.label">
          <dd class="text-2xl font-extrabold text-ink">{{ stat.value }}</dd>
          <dt class="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {{ stat.label }}
          </dt>
        </div>
      </dl>
    </section>

    <!-- Trending now: top 4 by likes -->
    <section v-if="stripItems.length > 0" class="mt-10">
      <div class="flex items-baseline justify-between">
        <h2 class="text-lg font-extrabold text-ink">Trending now</h2>
        <RouterLink
          to="/trending"
          class="text-sm font-semibold text-accent hover:text-accent-hover"
        >
          See all →
        </RouterLink>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-4 min-[900px]:grid-cols-4">
        <RouterLink
          v-for="(gif, i) in stripItems"
          :key="gif.id"
          :to="{ name: 'gif-detail', params: { gif_id: gif.id } }"
          class="group relative block overflow-hidden rounded-card ring-1 ring-line"
        >
          <img
            :src="resolveFileUrl(gif.file_url)"
            :alt="gif.title"
            loading="lazy"
            class="aspect-[4/3] w-full object-cover transition duration-200 group-hover:scale-105"
          />
          <span
            class="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-white shadow-md"
            aria-hidden="true"
          >
            {{ i + 1 }}
          </span>
          <div
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 pt-9 text-white"
          >
            <p class="truncate text-sm font-bold">{{ gif.title }}</p>
            <p class="truncate text-xs text-white/80">
              @{{ gif.uploader.username }} · {{ gif.like_count }} likes
            </p>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- Explore / Trending tabs + tag chips -->
    <div class="mt-10 flex flex-wrap items-center gap-3">
      <div class="flex rounded-full bg-raise p-1 ring-1 ring-line" role="tablist" aria-label="Feed mode">
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'explore'"
          class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
          :class="tab === 'explore' ? 'bg-ink text-bg' : 'text-ink-soft hover:text-ink'"
          @click="tab = 'explore'"
        >
          Explore
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'trending'"
          class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
          :class="tab === 'trending' ? 'bg-ink text-bg' : 'text-ink-soft hover:text-ink'"
          @click="tab = 'trending'"
        >
          Trending
        </button>
      </div>
      <h2 class="text-lg font-extrabold text-ink">
        {{ tab === 'trending' ? 'Trending GIFs' : selectedTag ? `#${selectedTag}` : 'Latest GIFs' }}
      </h2>
    </div>

    <div v-if="tab === 'explore' && topTags.length > 0" class="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="tag-chip"
        :class="{ 'tag-chip-active': !selectedTag }"
        @click="selectedTag = undefined"
      >
        All tags
      </button>
      <button
        v-for="tag in topTags"
        :key="tag"
        type="button"
        class="tag-chip"
        :class="{ 'tag-chip-active': selectedTag === tag }"
        @click="selectedTag = selectedTag === tag ? undefined : tag"
      >
        #{{ tag }}
      </button>
    </div>

    <PaginatedGifGrid :query="activeQuery" class="mt-5">
      <template #empty>
        <p>No GIFs yet.</p>
        <RouterLink to="/upload" class="mt-2 inline-block font-semibold text-accent hover:text-accent-hover">
          Be the first to upload one →
        </RouterLink>
      </template>
    </PaginatedGifGrid>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { backend } from '@/api/backend'
import { resolveFileUrl } from '@/api/client'
import { gifKeys, useGifFeed, useGifSearch, useTrendingGifs } from '@/api/queries'
import PaginatedGifGrid from '@/components/PaginatedGifGrid.vue'

const feed = useGifFeed()
const trending = useTrendingGifs()

const tab = ref<'explore' | 'trending'>('explore')
const selectedTag = ref<string | undefined>(undefined)
const tagSearch = useGifSearch('', selectedTag)

const activeQuery = computed(() => {
  if (tab.value === 'trending') return trending
  return selectedTag.value ? tagSearch : feed
})

/* Trending strip: first page of the trending endpoint, top 4 only. */
const strip = useQuery({
  queryKey: [...gifKeys.trending(), 'strip'],
  queryFn: () => backend.fetchTrendingGifs(1, 4),
})
const stripItems = computed(() => strip.data.value?.items ?? [])

/* Stats + tag cloud are derived from the loaded feed pages. */
const feedItems = computed(
  () => feed.data.value?.pages.flatMap((p) => p.items) ?? [],
)

const compact = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const stats = computed(() => [
  {
    label: 'GIFs shared',
    value: compact.format(feed.data.value?.pages[0]?.total ?? 0),
  },
  {
    label: 'Creators',
    value: compact.format(
      new Set(feedItems.value.map((g) => g.uploader.username)).size,
    ),
  },
  {
    label: 'Views',
    value: compact.format(
      feedItems.value.reduce((sum, g) => sum + g.view_count, 0),
    ),
  },
  {
    label: 'Likes',
    value: compact.format(
      feedItems.value.reduce((sum, g) => sum + g.like_count, 0),
    ),
  },
])

const topTags = computed(() => {
  const counts = new Map<string, number>()
  for (const gif of feedItems.value) {
    for (const tag of gif.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag)
})
</script>
