<template>
  <form class="flex w-full max-w-xl gap-2" @submit.prevent="submit">
    <input
      v-model="term"
      type="search"
      placeholder="Search GIFs…"
      aria-label="Search GIFs"
      class="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    />
    <button
      type="submit"
      class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      Search
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ initial?: string }>()
const router = useRouter()
const term = ref(props.initial ?? '')

function submit() {
  const q = term.value.trim()
  if (q.length === 0) return
  void router.push({ name: 'search', query: { q } })
}
</script>
