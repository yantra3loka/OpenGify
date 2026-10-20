<template>
  <button
    type="button"
    :aria-pressed="liked"
    :aria-label="liked ? 'Unlike this GIF' : 'Like this GIF'"
    :disabled="isPending"
    :class="
      variant === 'circle'
        ? [
            'flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur transition-all disabled:opacity-50',
            liked
              ? 'bg-accent text-white'
              : 'bg-white/90 text-slate-900 hover:bg-white hover:text-accent',
          ]
        : [
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50',
            liked
              ? 'bg-accent-soft text-accent hover:brightness-95'
              : 'bg-line/50 text-ink-soft hover:bg-line',
          ]
    "
    @click.stop="toggle"
  >
    <svg
      class="h-4 w-4 shrink-0"
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
    <span data-testid="like-count" :class="variant === 'circle' ? 'sr-only' : undefined">
      {{ likeCount }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAccessToken } from '@/api/client'
import { useToggleLike } from '@/api/queries'

const props = withDefaults(
  defineProps<{
    gifId: number
    likedByMe?: boolean
    likeCount: number
    /** 'pill' (default, with count) or 'circle' (icon-only overlay). */
    variant?: 'pill' | 'circle'
  }>(),
  { variant: 'pill' },
)

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
