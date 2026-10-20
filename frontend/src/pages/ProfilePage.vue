<template>
  <div class="px-4 py-8">
    <div v-if="profile.isPending.value" class="animate-pulse">
      <div class="flex items-center gap-4">
        <div class="h-20 w-20 rounded-full bg-line/60" />
        <div>
          <div class="h-8 w-48 rounded bg-line/60" />
          <div class="mt-2 h-4 w-32 rounded bg-line/60" />
        </div>
      </div>
    </div>

    <div v-else-if="profile.isError.value" class="py-16 text-center">
      <p class="text-ink-soft">{{ errorMessage }}</p>
      <RouterLink to="/" class="mt-3 inline-block font-semibold text-accent hover:text-accent-hover">
        ← Back to home
      </RouterLink>
    </div>

    <div v-else-if="user">
      <header class="mb-8 flex flex-wrap items-center gap-5">
        <span
          class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent text-3xl font-extrabold text-white"
          aria-hidden="true"
        >
          {{ user.username.charAt(0).toUpperCase() }}
        </span>
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-ink">@{{ user.username }}</h1>
          <p class="mt-1 text-sm text-ink-soft">
            Joined {{ formatDate(user.created_at) }} · {{ total }} GIFs
          </p>
          <p v-if="isOwn" class="mt-0.5 text-sm text-ink-soft">{{ user.email }}</p>
          <dl class="mt-3 flex gap-8">
            <div>
              <dd class="text-lg font-extrabold text-ink">{{ total }}</dd>
              <dt class="text-xs font-semibold uppercase tracking-wider text-ink-faint">Uploads</dt>
            </div>
            <div>
              <dd class="text-lg font-extrabold text-ink">{{ totalViews }}</dd>
              <dt class="text-xs font-semibold uppercase tracking-wider text-ink-faint">Total views</dt>
            </div>
            <div>
              <dd class="text-lg font-extrabold text-ink">{{ totalLikes }}</dd>
              <dt class="text-xs font-semibold uppercase tracking-wider text-ink-faint">Likes received</dt>
            </div>
            <div v-if="isOwn">
              <dd class="text-lg font-extrabold text-ink">{{ likedTotal }}</dd>
              <dt class="text-xs font-semibold uppercase tracking-wider text-ink-faint">Likes given</dt>
            </div>
          </dl>
        </div>
      </header>

      <div
        v-if="isOwn"
        class="mb-6 inline-flex rounded-full bg-raise p-1 ring-1 ring-line"
        role="tablist"
        aria-label="Profile sections"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'uploads'"
          class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
          :class="activeTab === 'uploads' ? 'bg-ink text-bg' : 'text-ink-soft hover:text-ink'"
          @click="activeTab = 'uploads'"
        >
          Uploads
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'liked'"
          class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
          :class="activeTab === 'liked' ? 'bg-ink text-bg' : 'text-ink-soft hover:text-ink'"
          @click="activeTab = 'liked'"
        >
          Liked
        </button>
      </div>

      <template v-if="!isOwn || activeTab === 'uploads'">
        <GifGrid v-if="items.length > 0" :gifs="items" />
        <div v-else class="py-16 text-center text-ink-soft">
          <p>@{{ user.username }} hasn't uploaded any GIFs yet.</p>
        </div>

        <div v-if="total > items.length" class="mt-6 text-center">
          <button
            type="button"
            :disabled="profile.isFetching.value"
            class="btn-soft px-4 py-2 text-sm"
            @click="loadMore"
          >
            {{ profile.isFetching.value ? 'Loading…' : 'Load more' }}
          </button>
        </div>
      </template>

      <PaginatedGifGrid v-else :query="liked">
        <template #empty>
          <p>No liked GIFs yet.</p>
        </template>
      </PaginatedGifGrid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getApiErrorMessage } from '@/api/client'
import { useMyLikedGifs, useUserProfile } from '@/api/queries'
import { useAuth } from '@/api/useAuth'
import type { GifPublic } from '@/api/types'
import GifGrid from '@/components/GifGrid.vue'
import PaginatedGifGrid from '@/components/PaginatedGifGrid.vue'

const route = useRoute()
const username = computed(() => String(route.params.username))
const page = ref(1)

const { currentUser } = useAuth()
const isOwn = computed(
  () => !!currentUser.value && currentUser.value.username === username.value,
)

const profile = useUserProfile(username, page)
const user = computed(() => profile.data.value?.user ?? null)
const total = computed(() => profile.data.value?.gifs.total ?? 0)
const errorMessage = computed(() =>
  profile.error.value ? getApiErrorMessage(profile.error.value) : 'Something went wrong.',
)

// Own profile only: the GIFs I've liked (GET /users/me/liked).
const activeTab = ref<'uploads' | 'liked'>('uploads')
watch(username, () => {
  activeTab.value = 'uploads'
})
const liked = useMyLikedGifs(() => isOwn.value)
const likedTotal = computed(() => liked.data.value?.pages[0]?.total ?? 0)

// Accumulate pages (contract paginates the profile's GIF list).
const items = ref<GifPublic[]>([])
watch(
  () => profile.data.value,
  (data) => {
    if (!data) return
    const seen = new Set(items.value.map((g) => g.id))
    for (const gif of data.gifs.items) {
      if (!seen.has(gif.id)) {
        seen.add(gif.id)
        items.value.push(gif)
      }
    }
  },
  { immediate: true },
)

const totalViews = computed(() =>
  items.value.reduce((sum, g) => sum + g.view_count, 0),
)
const totalLikes = computed(() =>
  items.value.reduce((sum, g) => sum + g.like_count, 0),
)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  })
}

function loadMore() {
  page.value += 1
}
</script>
