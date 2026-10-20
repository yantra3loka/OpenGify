<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAuth } from '@/api/useAuth'
import { useRouter } from 'vue-router'
import SearchBar from '@/components/SearchBar.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import ToastHost from '@/components/ToastHost.vue'

const { isAuthenticated, currentUser, logout, refreshCurrentUser } = useAuth()
const router = useRouter()

// After a plain login (or a reload with a stored token) currentUser is
// not set yet — resolve it so the profile chip can render.
watch(
  isAuthenticated,
  (authed) => {
    if (authed) void refreshCurrentUser()
  },
  { immediate: true },
)

const links = [
  { to: '/', label: 'Home' },
  { to: '/trending', label: 'Trending' },
]

const profileInitial = computed(() =>
  currentUser.value ? currentUser.value.username.charAt(0).toUpperCase() : '',
)

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen">
    <header class="topbar-bg sticky top-0 z-40 border-b border-line">
      <div class="mx-auto w-full max-w-[1240px] px-4">
        <nav class="flex h-16 items-center gap-5">
          <RouterLink to="/" class="flex shrink-0 items-center gap-2.5">
            <svg
              class="h-[34px] w-[34px] shrink-0"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <circle cx="24" cy="24" r="22" fill="var(--accent)" />
              <circle cx="16.5" cy="20" r="2.6" fill="#fff" />
              <path
                d="M28 16.6v6.8c0 1 1.1 1.6 2 1.1l5.4-3.4c.8-.5.8-1.7 0-2.2L30 15.5c-.9-.5-2 .1-2 1.1z"
                fill="#fff"
              />
              <path
                d="M14.5 28.5c2.7 3.9 5.9 5.9 9.5 5.9s6.8-2 9.5-5.9"
                stroke="#fff"
                stroke-width="3.4"
                stroke-linecap="round"
                fill="none"
              />
            </svg>
            <span class="text-xl font-extrabold tracking-tight">
              Open<span class="text-accent">GIPHY</span>
            </span>
          </RouterLink>
          <div class="hidden items-center gap-5 min-[900px]:flex">
            <RouterLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              class="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
              active-class="!text-accent"
            >
              {{ link.label }}
            </RouterLink>
          </div>
          <SearchBar class="mx-auto hidden min-[560px]:flex" />
          <div class="ml-auto flex shrink-0 items-center gap-3 min-[560px]:ml-0">
            <ThemeSwitcher class="hidden min-[560px]:flex" />
            <RouterLink
              v-if="isAuthenticated && currentUser"
              :to="{ name: 'profile', params: { username: currentUser.username } }"
              class="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 ring-1 ring-line transition-colors hover:ring-accent"
              :aria-label="`Your profile, @${currentUser.username}`"
            >
              <span
                class="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-white"
                aria-hidden="true"
              >
                {{ profileInitial }}
              </span>
              <span class="hidden text-sm font-semibold text-ink min-[560px]:inline">
                {{ currentUser.username }}
              </span>
            </RouterLink>
            <RouterLink
              v-if="isAuthenticated"
              to="/upload"
              class="btn-accent px-3.5 py-2 text-sm"
            >
              Upload
            </RouterLink>
            <template v-if="isAuthenticated">
              <button
                type="button"
                class="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
                @click="handleLogout"
              >
                Logout
              </button>
            </template>
            <template v-else>
              <RouterLink
                to="/login"
                class="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
              >
                Log in
              </RouterLink>
              <RouterLink to="/register" class="btn-accent px-3.5 py-2 text-sm">
                Sign up
              </RouterLink>
            </template>
          </div>
        </nav>
        <div class="flex items-center gap-2 pb-3 min-[560px]:hidden">
          <SearchBar class="min-w-0 flex-1" />
          <ThemeSwitcher class="shrink-0" />
        </div>
      </div>
    </header>
    <main class="mx-auto w-full max-w-[1240px]">
      <RouterView />
    </main>
    <ToastHost />
  </div>
</template>
