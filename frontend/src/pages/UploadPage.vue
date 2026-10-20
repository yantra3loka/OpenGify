<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <h1 class="text-3xl font-extrabold tracking-tight text-ink">Upload a GIF</h1>
    <p class="mt-1 text-sm text-ink-soft">Share a looping moment with everyone.</p>

    <form
      class="mt-6 space-y-5 rounded-card bg-raise p-6 shadow-sm ring-1 ring-line"
      novalidate
      @submit.prevent="submit"
    >
      <div
        :class="[
          'rounded-card border-2 border-dashed p-8 text-center transition-colors',
          isDragging ? 'border-accent bg-accent-soft' : 'border-line bg-bg',
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/gif,.gif"
          class="hidden"
          aria-label="Choose a GIF file"
          @change="onFileChange"
        />
        <div v-if="previewUrl" class="mx-auto max-w-xs">
          <img :src="previewUrl" alt="Upload preview" class="mx-auto max-h-64 rounded-lg" />
          <p class="mt-2 text-sm text-ink-soft">{{ file?.name }}</p>
          <button
            type="button"
            class="mt-1 text-xs font-semibold text-ink-faint transition-colors hover:text-danger"
            @click.stop="clearFile"
          >
            Remove
          </button>
        </div>
        <div v-else class="cursor-pointer">
          <p class="text-sm font-semibold text-ink">
            Drag &amp; drop your GIF here, or click to browse
          </p>
          <p class="mt-1 text-xs text-ink-faint">GIF only · max 10 MB</p>
        </div>
      </div>

      <div>
        <label for="upload-title" class="block text-sm font-semibold text-ink">
          Title <span class="text-accent">*</span>
        </label>
        <input
          id="upload-title"
          v-model="title"
          type="text"
          required
          maxlength="120"
          placeholder="Give it a catchy title"
          class="field mt-1"
        />
      </div>

      <div>
        <label for="upload-description" class="block text-sm font-semibold text-ink">
          Description <span class="font-normal text-ink-faint">(optional)</span>
        </label>
        <textarea
          id="upload-description"
          v-model="description"
          rows="3"
          maxlength="500"
          placeholder="What's happening in this GIF?"
          class="field mt-1"
        />
      </div>

      <div>
        <label for="upload-tags" class="block text-sm font-semibold text-ink">
          Tags <span class="font-normal text-ink-faint">(optional, comma-separated)</span>
        </label>
        <input
          id="upload-tags"
          v-model="tagsInput"
          type="text"
          placeholder="funny, cat, reaction"
          class="field mt-1"
        />
      </div>

      <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>

      <button type="submit" :disabled="uploading" class="btn-accent w-full px-4 py-2.5 text-sm">
        {{ uploading ? 'Uploading…' : 'Upload GIF' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { getApiErrorMessage } from '@/api/client'
import { useUploadGif } from '@/api/queries'
import { useToast } from '@/composables/useToast'

const MAX_BYTES = 10 * 1024 * 1024

const file = ref<File | null>(null)
const title = ref('')
const description = ref('')
const tagsInput = ref('')
const isDragging = ref(false)
const error = ref<string | null>(null)

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const router = useRouter()
const upload = useUploadGif()
const uploading = computed(() => upload.isPending.value)
const { toast } = useToast()

const previewUrl = ref<string | null>(null)

function revokePreview() {
  if (previewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

onUnmounted(revokePreview)

/** Client-side checks mirror the contract (GIF, ≤10 MB, title ≤120,
 *  description ≤500); the server validates authoritatively. */
function pickFile(candidate: File | null | undefined) {
  error.value = null
  if (!candidate) return
  const isGif =
    candidate.type === 'image/gif' || candidate.name.toLowerCase().endsWith('.gif')
  if (!isGif) {
    error.value = 'Please choose a GIF file.'
    return
  }
  if (candidate.size > MAX_BYTES) {
    error.value = 'File is too large — maximum 10 MB.'
    return
  }
  revokePreview()
  file.value = candidate
  previewUrl.value =
    typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(candidate)
      : `preview:${candidate.name}`
  if (!title.value) {
    title.value = candidate.name.replace(/\.gif$/i, '').replace(/[_-]+/g, ' ')
  }
}

function onFileChange(e: Event) {
  pickFile((e.target as HTMLInputElement).files?.[0])
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  pickFile(e.dataTransfer?.files?.[0])
}

function clearFile() {
  revokePreview()
  file.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function submit() {
  error.value = null
  if (!file.value) {
    error.value = 'Please choose a GIF file first.'
    return
  }
  if (!title.value.trim()) {
    error.value = 'Please give your GIF a title.'
    return
  }
  const tags = tagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
  try {
    const gif = await upload.mutateAsync({
      file: file.value,
      title: title.value.trim().slice(0, 120),
      description: description.value.trim().slice(0, 500) || undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
    toast('GIF uploaded — looking good!')
    await router.push({ name: 'gif-detail', params: { gif_id: gif.id } })
  } catch (err) {
    error.value = getApiErrorMessage(err)
  }
}
</script>
