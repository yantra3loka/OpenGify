<template>
  <form class="flex w-full max-w-xl gap-2" @submit.prevent="submit">
    <input
      v-model="term"
      type="search"
      placeholder="Search GIFs, tags, creators…"
      aria-label="Search GIFs"
      class="field min-w-0 flex-1 !rounded-full !px-4"
    />
    <button type="submit" class="btn-accent shrink-0 rounded-full px-4 py-2 text-sm">
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
