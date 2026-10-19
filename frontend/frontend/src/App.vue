<script setup lang="ts">
import { useAuth } from '@/api/useAuth'
import { useRouter } from 'vue-router'

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
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <nav class="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <RouterLink to="/" class="text-xl font-extrabold tracking-tight">
          <span class="text-indigo-600">Open</span>GIPHY
        </RouterLink>
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-sm font-medium text-slate-600 hover:text-slate-900"
          active-class="!text-indigo-600"
        >
          {{ link.label }}
        </RouterLink>
        <div class="ml-auto flex items-center gap-3">
          <RouterLink
            v-if="isAuthenticated"
            to="/upload"
            class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Upload
          </RouterLink>
          <template v-if="isAuthenticated">
            <button
              type="button"
              class="text-sm font-medium text-slate-600 hover:text-slate-900"
              @click="handleLogout"
            >
              Logout
            </button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="text-sm font-medium text-slate-600 hover:text-slate-900">
              Login
            </RouterLink>
            <RouterLink
              to="/register"
              class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Register
            </RouterLink>
          </template>
        </div>
      </nav>
    </header>
    <main class="mx-auto max-w-6xl">
      <RouterView />
    </main>
  </div>
</template>
