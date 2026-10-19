<template>
  <div class="mx-auto max-w-md px-4 py-12">
    <h1 class="text-2xl font-bold text-slate-900">Create your account</h1>
    <p class="mt-1 text-sm text-slate-500">Join OpenGIPHY to upload and like GIFs.</p>

    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <div>
        <label for="reg-email" class="block text-sm font-medium text-slate-700">Email</label>
        <input
          id="reg-email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label for="reg-username" class="block text-sm font-medium text-slate-700">
          Username <span class="font-normal text-slate-400">(3–30 characters)</span>
        </label>
        <input
          id="reg-username"
          v-model="username"
          type="text"
          autocomplete="username"
          required
          minlength="3"
          maxlength="30"
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label for="reg-password" class="block text-sm font-medium text-slate-700">
          Password <span class="font-normal text-slate-400">(min 8 characters)</span>
        </label>
        <input
          id="reg-password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          required
          minlength="8"
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label for="reg-confirm" class="block text-sm font-medium text-slate-700">Confirm password</label>
        <input
          id="reg-confirm"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
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
        {{ pending ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-slate-500">
      Already have an account?
      <RouterLink to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
        Log in
      </RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/api/useAuth'

const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref<string | null>(null)
const pending = ref(false)

const { register } = useAuth()
const router = useRouter()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Client-side checks mirror the contract (RegisterRequest) so the user
 *  gets instant feedback; the server still validates authoritatively. */
function validate(): string | null {
  if (!EMAIL_RE.test(email.value.trim())) return 'Please enter a valid email address.'
  const name = username.value.trim()
  if (name.length < 3 || name.length > 30)
    return 'Username must be 3–30 characters.'
  if (password.value.length < 8) return 'Password must be at least 8 characters.'
  if (password.value !== confirmPassword.value) return 'Passwords do not match.'
  return null
}

async function submit() {
  error.value = validate()
  if (error.value) return
  pending.value = true
  try {
    await register({
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
    })
    await router.push('/')
  } catch (err) {
    error.value = getApiErrorMessage(err)
  } finally {
    pending.value = false
  }
}
</script>
