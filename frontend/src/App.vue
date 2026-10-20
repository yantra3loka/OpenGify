<script setup lang="ts">
import { useAuth } from '@/api/useAuth'
import { useRouter } from 'vue-router'
import SearchBar from '@/components/SearchBar.vue'
import ToastHost from '@/components/ToastHost.vue'

const { isAuthenticated, logout } = useAuth()
const router = useRouter()

const links = [
  { to: '/', label: 'Home' },
  { to: '/trending', label: 'Trending' },
  { to: '/search', label: 'Search' },
]

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
            <span
              class="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-accent"
              aria-hidden="true"
            >
              <svg class="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            </span>
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
          <SearchBar class="mx-auto hidden max-w-md min-[560px]:block" />
          <div class="ml-auto flex shrink-0 items-center gap-3 min-[560px]:ml-0">
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
        <div class="pb-3 min-[560px]:hidden">
          <SearchBar />
        </div>
      </div>
    </header>
    <main class="mx-auto w-full max-w-[1240px]">
      <RouterView />
    </main>
    <ToastHost />
  </div>
</template>
