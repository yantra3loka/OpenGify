<template>
  <div class="flex justify-center px-4 py-12">
    <div class="w-full max-w-md rounded-card bg-raise p-6 shadow-sm ring-1 ring-line sm:p-8">
      <h1 class="text-2xl font-extrabold tracking-tight text-ink">Create your account</h1>
      <p class="mt-1 text-sm text-ink-soft">Join OpenGIPHY to upload and like GIFs.</p>

      <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
        <div>
          <label for="reg-email" class="block text-sm font-semibold text-ink">Email</label>
          <input
            id="reg-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="field mt-1"
          />
        </div>
        <div>
          <label for="reg-username" class="block text-sm font-semibold text-ink">
            Username <span class="font-normal text-ink-faint">(3–30 characters)</span>
          </label>
          <input
            id="reg-username"
            v-model="username"
            type="text"
            autocomplete="username"
            required
            minlength="3"
            maxlength="30"
            class="field mt-1"
          />
        </div>
        <div>
          <label for="reg-password" class="block text-sm font-semibold text-ink">
            Password <span class="font-normal text-ink-faint">(min 8 characters)</span>
          </label>
          <input
            id="reg-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="field mt-1"
          />
        </div>
        <div>
          <label for="reg-confirm" class="block text-sm font-semibold text-ink">Confirm password</label>
          <input
            id="reg-confirm"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            class="field mt-1"
          />
        </div>

        <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>

        <button type="submit" :disabled="pending" class="btn-accent w-full px-4 py-2.5 text-sm">
          {{ pending ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-ink-soft">
        Already have an account?
        <RouterLink to="/login" class="font-semibold text-accent hover:text-accent-hover">
          Log in
        </RouterLink>
      </p>
    </div>
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
