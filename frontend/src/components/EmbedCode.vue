<template>
  <section class="rounded-card bg-raise p-4 ring-1 ring-line" aria-label="Embed codes">
    <h2 class="text-sm font-bold text-ink">Embed this GIF</h2>
    <div class="mt-3 flex gap-1 rounded-lg bg-line/40 p-1" role="tablist" aria-label="Embed format">
      <button
        v-for="snippet in snippets"
        :key="snippet.label"
        type="button"
        role="tab"
        :aria-selected="activeLabel === snippet.label"
        class="flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors"
        :class="
          activeLabel === snippet.label
            ? 'bg-raise text-ink shadow-sm'
            : 'text-ink-soft hover:text-ink'
        "
        @click="activeLabel = snippet.label"
      >
        {{ snippet.label }}
      </button>
    </div>
    <div v-for="snippet in snippets" :key="snippet.label" v-show="activeLabel === snippet.label">
      <code class="code-box mt-3 block overflow-x-auto whitespace-nowrap p-3 text-xs">
        {{ snippet.code }}
      </code>
      <button type="button" class="btn-soft mt-2 px-3 py-1.5 text-xs" @click="copy(snippet)">
        {{ copiedLabel === snippet.label ? 'Copied!' : 'Copy' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { resolveFileUrl } from '@/api/client'
import type { GifPublic } from '@/api/types'
import { useToast } from '@/composables/useToast'

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

const activeLabel = ref('HTML')
const copiedLabel = ref<string | null>(null)
const { toast } = useToast()

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
  toast(`${snippet.label} embed code copied`)
  setTimeout(() => {
    copiedLabel.value = null
  }, 1500)
}
</script>
