<template>
  <div class="flex justify-center px-4 py-12">
    <div class="w-full max-w-md rounded-card bg-raise p-6 shadow-sm ring-1 ring-line sm:p-8">
      <h1 class="text-2xl font-extrabold tracking-tight text-ink">Welcome back</h1>
      <p class="mt-1 text-sm text-ink-soft">Log in to upload and like GIFs.</p>

      <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
        <div>
          <label for="login-email" class="block text-sm font-semibold text-ink">Email</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="field mt-1"
          />
        </div>
        <div>
          <label for="login-password" class="block text-sm font-semibold text-ink">Password</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="field mt-1"
          />
        </div>

        <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>

        <button type="submit" :disabled="pending" class="btn-accent w-full px-4 py-2.5 text-sm">
          {{ pending ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-ink-soft">
        <RouterLink to="/forgot-password" class="font-semibold text-accent hover:text-accent-hover">
          Forgot password?
        </RouterLink>
      </p>

      <p class="mt-4 text-center text-sm text-ink-soft">
        New to OpenGIPHY?
        <RouterLink to="/register" class="font-semibold text-accent hover:text-accent-hover">
          Create an account
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/api/useAuth'

const email = ref('demo@example.com')
const password = ref('demo1234')
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
