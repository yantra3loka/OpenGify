<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div v-if="detail.isPending.value" class="animate-pulse">
      <div class="h-96 rounded-xl bg-slate-200" />
      <div class="mt-4 h-6 w-2/3 rounded bg-slate-200" />
    </div>

    <div v-else-if="detail.isError.value" class="py-16 text-center">
      <p class="text-slate-600">{{ errorMessage }}</p>
      <RouterLink to="/" class="mt-3 inline-block font-medium text-indigo-600 hover:text-indigo-500">
        ← Back to home
      </RouterLink>
    </div>

    <article v-else-if="gif" class="grid gap-6 md:grid-cols-[1fr_320px]">
      <div>
        <img
          :src="resolveFileUrl(gif.file_url)"
          :alt="gif.title"
          class="w-full rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
        />
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <LikeButton :gif-id="gif.id" :liked-by-me="gif.liked_by_me" :like-count="gif.like_count" />
          <span class="text-sm text-slate-500">{{ gif.view_count }} views</span>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">{{ gif.title }}</h1>
          <p class="mt-1 text-sm text-slate-500">
            by
            <RouterLink
              :to="{ name: 'profile', params: { username: gif.uploader.username } }"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              @{{ gif.uploader.username }}
            </RouterLink>
            · {{ formatDate(gif.created_at) }}
          </p>
          <p v-if="gif.description" class="mt-3 text-sm text-slate-700">{{ gif.description }}</p>
          <div v-if="gif.tags.length > 0" class="mt-3 flex flex-wrap gap-1.5">
            <TagChip v-for="tag in gif.tags" :key="tag" :tag="tag" />
          </div>
        </div>

        <EmbedCode :gif="gif" />

        <section class="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <h2 class="text-sm font-semibold text-slate-900">Report this GIF</h2>
          <div v-if="reportSent" class="mt-2 text-sm text-emerald-600">
            Thanks — your report has been recorded.
          </div>
          <form v-else class="mt-2 space-y-2" @submit.prevent="submitReport">
            <input
              v-model="reportReason"
              type="text"
              placeholder="Reason (optional)"
              aria-label="Report reason"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p v-if="reportError" role="alert" class="text-sm text-rose-600">{{ reportError }}</p>
            <button
              type="submit"
              :disabled="reportPending"
              class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {{ reportPending ? 'Reporting…' : 'Report' }}
            </button>
          </form>
        </section>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getApiErrorMessage, resolveFileUrl } from '@/api/client'
import { useGifDetail, useReportGif } from '@/api/queries'
import EmbedCode from '@/components/EmbedCode.vue'
import LikeButton from '@/components/LikeButton.vue'
import TagChip from '@/components/TagChip.vue'

const route = useRoute()
const gifId = computed(() => Number(route.params.gif_id))

const detail = useGifDetail(gifId.value)
const gif = computed(() => detail.data.value ?? null)
const errorMessage = computed(() =>
  detail.error.value ? getApiErrorMessage(detail.error.value) : 'Something went wrong.',
)

const reportReason = ref('')
const reportError = ref<string | null>(null)
const reportSent = ref(false)
const report = useReportGif()
const reportPending = computed(() => report.isPending.value)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function submitReport() {
  reportError.value = null
  try {
    await report.mutateAsync({
      id: gifId.value,
      reason: reportReason.value.trim() || undefined,
    })
    reportSent.value = true
  } catch (err) {
    reportError.value = getApiErrorMessage(err)
  }
}
</script>
