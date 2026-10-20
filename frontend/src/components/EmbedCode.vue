<template>
  <section class="rounded-xl bg-white p-4 ring-1 ring-slate-200" aria-label="Embed codes">
    <h2 class="text-sm font-semibold text-slate-900">Embed this GIF</h2>
    <div
      v-for="snippet in snippets"
      :key="snippet.label"
      class="mt-3"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-slate-500">{{ snippet.label }}</span>
        <button
          type="button"
          class="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
          @click="copy(snippet)"
        >
          {{ copiedLabel === snippet.label ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <code class="mt-1 block overflow-x-auto rounded-md bg-slate-50 p-2 text-xs text-slate-700 ring-1 ring-slate-200">
        {{ snippet.code }}
      </code>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { resolveFileUrl } from '@/api/client'
import type { GifPublic } from '@/api/types'

const props = defineProps<{ gif: GifPublic }>()

const pageUrl = computed(
  () => `${window.location.origin}/g/${props.gif.id}`,
)

// Embed codes are pasted outside this app, so the URL must be absolute.
const fileUrl = computed(() => resolveFileUrl(props.gif.file_url))

const snippets = computed(() => [
  {
    label: 'HTML',
    code: `<a href="${pageUrl.value}"><img src="${fileUrl.value}" alt="${props.gif.title}"></a>`,
  },
  {
    label: 'Markdown',
    code: `[![${props.gif.title}](${fileUrl.value})](${pageUrl.value})`,
  },
  { label: 'Direct URL', code: fileUrl.value },
])

const copiedLabel = ref<string | null>(null)

async function copy(snippet: { label: string; code: string }) {
  try {
    await navigator.clipboard.writeText(snippet.code)
  } catch {
    // Clipboard API unavailable (e.g. insecure context) — fall back to selection.
    const ta = document.createElement('textarea')
    ta.value = snippet.code
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copiedLabel.value = snippet.label
  setTimeout(() => {
    copiedLabel.value = null
  }, 1500)
}
</script>
