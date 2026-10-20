<template>
  <div class="px-4 py-8">
    <div v-if="detail.isPending.value" class="animate-pulse">
      <div class="h-96 rounded-card bg-line/60" />
      <div class="mt-4 h-6 w-2/3 rounded bg-line/60" />
    </div>

    <div v-else-if="detail.isError.value" class="py-16 text-center">
      <p class="text-ink-soft">{{ errorMessage }}</p>
      <RouterLink to="/" class="mt-3 inline-block font-semibold text-accent hover:text-accent-hover">
        ← Back to home
      </RouterLink>
    </div>

    <article v-else-if="gif" class="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <img
          :src="resolveFileUrl(gif.file_url)"
          :alt="gif.title"
          class="w-full rounded-card bg-raise shadow-sm ring-1 ring-line"
        />
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <LikeButton :gif-id="gif.id" :liked-by-me="gif.liked_by_me" :like-count="gif.like_count" />
          <button
            type="button"
            class="btn-soft px-3 py-1.5 text-sm"
            :disabled="downloading"
            @click="downloadGif"
          >
            <svg
              class="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            {{ downloading ? 'Downloading…' : 'Download' }}
          </button>
          <span class="text-sm text-ink-soft">{{ gif.view_count }} views</span>
          <span class="text-sm text-ink-faint">{{ formatDate(gif.created_at) }}</span>
        </div>
      </div>

      <div class="space-y-5">
        <div>
          <div class="flex items-center gap-3">
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-white"
              aria-hidden="true"
            >
              {{ gif.uploader.username.charAt(0).toUpperCase() }}
            </span>
            <div>
              <RouterLink
                :to="{ name: 'profile', params: { username: gif.uploader.username } }"
                class="font-bold text-ink transition-colors hover:text-accent"
              >
                @{{ gif.uploader.username }}
              </RouterLink>
              <p class="text-xs text-ink-faint">Uploader</p>
            </div>
          </div>

          <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-ink">{{ gif.title }}</h1>
          <p v-if="gif.description" class="mt-2 text-sm leading-relaxed text-ink-soft">
            {{ gif.description }}
          </p>

          <dl class="mt-4 flex gap-8 border-y border-line py-3">
            <div>
              <dd class="text-lg font-extrabold text-ink">{{ gif.like_count }}</dd>
              <dt class="text-xs font-semibold uppercase tracking-wider text-ink-faint">Likes</dt>
            </div>
            <div>
              <dd class="text-lg font-extrabold text-ink">{{ gif.view_count }}</dd>
              <dt class="text-xs font-semibold uppercase tracking-wider text-ink-faint">Views</dt>
            </div>
            <div>
              <dd class="text-lg font-extrabold text-ink">{{ formatDate(gif.created_at) }}</dd>
              <dt class="text-xs font-semibold uppercase tracking-wider text-ink-faint">Posted</dt>
            </div>
          </dl>

          <div v-if="gif.tags.length > 0" class="mt-4 flex flex-wrap gap-1.5">
            <TagChip v-for="tag in gif.tags" :key="tag" :tag="tag" />
          </div>
        </div>

        <EmbedCode :gif="gif" />

        <section class="rounded-card bg-raise p-4 ring-1 ring-line">
          <h2 class="text-sm font-bold text-ink">Report this GIF</h2>
          <div v-if="reportSent" class="mt-2 text-sm font-medium text-accent">
            Thanks — your report has been recorded.
          </div>
          <form v-else class="mt-2 space-y-2" @submit.prevent="submitReport">
            <input
              v-model="reportReason"
              type="text"
              placeholder="Reason (optional)"
              aria-label="Report reason"
              class="field"
            />
            <p v-if="reportError" role="alert" class="text-sm text-danger">{{ reportError }}</p>
            <button type="submit" :disabled="reportPending" class="btn-soft px-3 py-1.5 text-sm">
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
import { useToast } from '@/composables/useToast'

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
const { toast } = useToast()

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const downloading = ref(false)

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Save the GIF file to the visitor's device. The file is served from
 * the API origin, so a plain <a download> would be ignored
 * cross-origin — fetch it as a Blob and trigger the download via an
 * object URL instead. On failure, fall back to opening the file in a
 * new tab. Works for anonymous visitors too (files are public).
 */
async function downloadGif() {
  if (!gif.value || downloading.value) return
  downloading.value = true
  const fileUrl = resolveFileUrl(gif.value.file_url)
  const filename = `${slugifyTitle(gif.value.title) || `opengiphy-${gif.value.id}`}.gif`
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
    toast('Download started')
  } catch {
    window.open(fileUrl, '_blank', 'noopener')
    toast('Download failed — opened the GIF in a new tab')
  } finally {
    downloading.value = false
  }
}

async function submitReport() {
  reportError.value = null
  try {
    await report.mutateAsync({
      id: gifId.value,
      reason: reportReason.value.trim() || undefined,
    })
    reportSent.value = true
    toast('Report submitted — thanks for flagging it')
  } catch (err) {
    reportError.value = getApiErrorMessage(err)
  }
}
</script>
