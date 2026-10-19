<template>
  <button
    type="button"
    :aria-pressed="liked"
    :aria-label="liked ? 'Unlike this GIF' : 'Like this GIF'"
    :disabled="isPending"
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50"
    :class="
      liked
        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    "
    @click.stop="toggle"
  >
    <svg
      class="h-4 w-4"
      viewBox="0 0 24 24"
      :fill="liked ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"
      />
    </svg>
    <span data-testid="like-count">{{ likeCount }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAccessToken } from '@/api/client'
import { useToggleLike } from '@/api/queries'

const props = defineProps<{
  gifId: number
  likedByMe?: boolean
  likeCount: number
}>()

const router = useRouter()
const toggleLike = useToggleLike()

const liked = computed(() => props.likedByMe ?? false)
const isPending = computed(() => toggleLike.isPending.value)

function toggle() {
  if (!getAccessToken()) {
    void router.push({
      name: 'login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
    return
  }
  toggleLike.mutate({ id: props.gifId, liked: liked.value })
}
</script>
