<template>
  <div class="px-4 py-8">
    <div v-if="profile.isPending.value" class="mx-auto max-w-4xl animate-pulse">
      <div class="h-8 w-48 rounded bg-slate-200" />
      <div class="mt-2 h-4 w-32 rounded bg-slate-200" />
    </div>

    <div v-else-if="profile.isError.value" class="py-16 text-center">
      <p class="text-slate-600">{{ errorMessage }}</p>
      <RouterLink to="/" class="mt-3 inline-block font-medium text-indigo-600 hover:text-indigo-500">
        ← Back to home
      </RouterLink>
    </div>

    <div v-else-if="user" class="mx-auto max-w-6xl">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">@{{ user.username }}</h1>
        <p class="mt-1 text-sm text-slate-500">
          Joined {{ formatDate(user.created_at) }} · {{ total }} GIFs
        </p>
      </header>

      <GifGrid v-if="items.length > 0" :gifs="items" />
      <div v-else class="py-16 text-center text-slate-500">
        <p>@{{ user.username }} hasn't uploaded any GIFs yet.</p>
      </div>

      <div v-if="total > items.length" class="mt-6 text-center">
        <button
          type="button"
          :disabled="profile.isFetching.value"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          @click="loadMore"
        >
          {{ profile.isFetching.value ? 'Loading…' : 'Load more' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getApiErrorMessage } from '@/api/client'
import { useUserProfile } from '@/api/queries'
import type { GifPublic } from '@/api/types'
import GifGrid from '@/components/GifGrid.vue'

const route = useRoute()
const username = computed(() => String(route.params.username))
const page = ref(1)

const profile = useUserProfile(username, page)
const user = computed(() => profile.data.value?.user ?? null)
const total = computed(() => profile.data.value?.gifs.total ?? 0)
const errorMessage = computed(() =>
  profile.error.value ? getApiErrorMessage(profile.error.value) : 'Something went wrong.',
)

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
