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

      <section v-if="isOwn" class="mb-8 rounded-card bg-raise p-6 ring-1 ring-line">
        <h2 class="text-lg font-extrabold tracking-tight text-ink">Edit profile</h2>

        <form class="mt-4" novalidate @submit.prevent="saveUsername">
          <div class="flex flex-wrap items-end gap-3">
            <div class="min-w-52 flex-1">
              <label for="edit-username" class="block text-sm font-semibold text-ink">
                Username
              </label>
              <input
                id="edit-username"
                v-model="editUsername"
                type="text"
                autocomplete="username"
                class="field mt-1"
              />
            </div>
            <button
              type="submit"
              :disabled="savingUsername"
              class="btn-accent px-4 py-2 text-sm"
            >
              {{ savingUsername ? 'Saving…' : 'Save username' }}
            </button>
          </div>
          <p v-if="usernameError" role="alert" class="mt-2 text-sm text-danger">
            {{ usernameError }}
          </p>
        </form>

        <div class="my-6 border-t border-line" />

        <form class="space-y-4" novalidate @submit.prevent="savePassword">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Change password
          </h3>
          <div>
            <label for="edit-current-password" class="block text-sm font-semibold text-ink">
              Current password
            </label>
            <input
              id="edit-current-password"
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
              class="field mt-1"
            />
          </div>
          <div>
            <label for="edit-new-password" class="block text-sm font-semibold text-ink">
              New password
            </label>
            <input
              id="edit-new-password"
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              class="field mt-1"
            />
          </div>
          <div>
            <label for="edit-confirm-password" class="block text-sm font-semibold text-ink">
              Confirm new password
            </label>
            <input
              id="edit-confirm-password"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              class="field mt-1"
            />
          </div>
          <p v-if="passwordError" role="alert" class="text-sm text-danger">
            {{ passwordError }}
          </p>
          <button
            type="submit"
            :disabled="savingPassword"
            class="btn-soft px-4 py-2 text-sm"
          >
            {{ savingPassword ? 'Saving…' : 'Change password' }}
          </button>
        </form>
      </section>

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
import { useRoute, useRouter } from 'vue-router'
import { backend } from '@/api/backend'
import { getApiErrorMessage } from '@/api/client'
import { useMyLikedGifs, useUserProfile } from '@/api/queries'
import { useAuth } from '@/api/useAuth'
import type { GifPublic } from '@/api/types'
import { useToast } from '@/composables/useToast'
import GifGrid from '@/components/GifGrid.vue'
import PaginatedGifGrid from '@/components/PaginatedGifGrid.vue'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
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

/* ---------------- Edit profile (own profile only) ---------------- */

const editUsername = ref('')
watch(
  () => user.value?.username,
  (name) => {
    if (name) editUsername.value = name
  },
  { immediate: true },
)

const usernameError = ref<string | null>(null)
const savingUsername = ref(false)

async function saveUsername() {
  usernameError.value = null
  const next = editUsername.value.trim()
  if (!next) {
    usernameError.value = 'Please enter a username.'
    return
  }
  savingUsername.value = true
  try {
    const updated = await backend.updateMyProfile({ username: next })
    // Shared auth state: the topbar chip picks the new name up immediately.
    currentUser.value = updated
    toast('Username updated.')
    if (updated.username !== username.value) {
      await router.push({
        name: 'profile',
        params: { username: updated.username },
      })
    }
  } catch (err) {
    usernameError.value = getApiErrorMessage(err)
  } finally {
    savingUsername.value = false
  }
}

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref<string | null>(null)
const savingPassword = ref(false)

async function savePassword() {
  passwordError.value = null
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    passwordError.value = 'Please fill in all three password fields.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'New password and confirm password do not match.'
    return
  }
  savingPassword.value = true
  try {
    await backend.changeMyPassword({
      current_password: currentPassword.value,
      new_password: newPassword.value,
      confirm_password: confirmPassword.value,
    })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    toast('Password updated.')
  } catch (err) {
    passwordError.value = getApiErrorMessage(err)
  } finally {
    savingPassword.value = false
  }
}
</script>
