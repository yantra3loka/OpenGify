<template>
  <article
    class="group relative mb-5 break-inside-avoid overflow-hidden rounded-card bg-raise ring-1 ring-line transition duration-200 hover:-translate-y-1 hover:shadow-xl"
  >
    <div class="relative">
      <RouterLink :to="{ name: 'gif-detail', params: { gif_id: gif.id } }" class="block">
        <img
          :src="resolveFileUrl(gif.file_url)"
          :alt="gif.title"
          loading="lazy"
          class="w-full object-cover"
        />
      </RouterLink>
      <div
        class="absolute right-3 top-3 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <LikeButton
          variant="circle"
          :gif-id="gif.id"
          :liked-by-me="gif.liked_by_me"
          :like-count="gif.like_count"
        />
      </div>
    </div>
    <div class="p-3.5">
      <RouterLink
        :to="{ name: 'gif-detail', params: { gif_id: gif.id } }"
        class="block truncate text-sm font-semibold text-ink transition-colors hover:text-accent"
      >
        {{ gif.title }}
      </RouterLink>
      <div class="mt-1 flex items-center justify-between text-xs text-ink-soft">
        <RouterLink
          :to="{ name: 'profile', params: { username: gif.uploader.username } }"
          class="font-medium transition-colors hover:text-accent"
        >
          @{{ gif.uploader.username }}
        </RouterLink>
        <span>{{ gif.view_count }} views</span>
      </div>
      <div class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-faint">
        <svg
          class="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          :fill="gif.liked_by_me ? 'var(--accent)' : 'none'"
          :stroke="gif.liked_by_me ? 'var(--accent)' : 'currentColor'"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"
          />
        </svg>
        <span>{{ gif.like_count }} likes</span>
      </div>
      <div v-if="gif.tags.length > 0" class="mt-2.5 flex flex-wrap gap-1.5">
        <TagChip v-for="tag in gif.tags" :key="tag" :tag="tag" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { resolveFileUrl } from '@/api/client'
import type { GifPublic } from '@/api/types'
import LikeButton from '@/components/LikeButton.vue'
import TagChip from '@/components/TagChip.vue'

defineProps<{ gif: GifPublic }>()
</script>
