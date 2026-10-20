<template>
  <article class="mb-4 break-inside-avoid overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
    <RouterLink :to="{ name: 'gif-detail', params: { gif_id: gif.id } }" class="block">
      <img
        :src="resolveFileUrl(gif.file_url)"
        :alt="gif.title"
        loading="lazy"
        class="w-full object-cover"
      />
    </RouterLink>
    <div class="p-3">
      <RouterLink
        :to="{ name: 'gif-detail', params: { gif_id: gif.id } }"
        class="block truncate text-sm font-semibold text-slate-900 hover:text-indigo-600"
      >
        {{ gif.title }}
      </RouterLink>
      <div class="mt-1 flex items-center justify-between text-xs text-slate-500">
        <RouterLink
          :to="{ name: 'profile', params: { username: gif.uploader.username } }"
          class="font-medium hover:text-indigo-600"
        >
          @{{ gif.uploader.username }}
        </RouterLink>
        <span>{{ gif.view_count }} views</span>
      </div>
      <div v-if="gif.tags.length > 0" class="mt-2 flex flex-wrap gap-1.5">
        <TagChip v-for="tag in gif.tags" :key="tag" :tag="tag" />
      </div>
      <div class="mt-2">
        <LikeButton
          :gif-id="gif.id"
          :liked-by-me="gif.liked_by_me"
          :like-count="gif.like_count"
        />
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
