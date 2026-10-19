<template>
  <div class="mx-auto max-w-md px-4 py-12">
    <h1 class="text-2xl font-bold text-slate-900">Welcome back</h1>
    <p class="mt-1 text-sm text-slate-500">Log in to upload and like GIFs.</p>

    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <div>
        <label for="login-email" class="block text-sm font-medium text-slate-700">Email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label for="login-password" class="block text-sm font-medium text-slate-700">Password</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <p v-if="error" role="alert" class="text-sm text-rose-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="pending"
        class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {{ pending ? 'Logging in…' : 'Log in' }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-slate-500">
      New to OpenGIPHY?
      <RouterLink to="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
        Create an account
      </RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/api/useAuth'

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const pending = ref(false)

const { login } = useAuth()
const router = useRouter()
const route = useRoute()

async function submit() {
  error.value = null
  if (!email.value.trim() || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }
  pending.value = true
  try {
    await login({ email: email.value.trim(), password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (err) {
    error.value = getApiErrorMessage(err)
  } finally {
    pending.value = false
  }
}
</script>
