<template>
  <div class="flex justify-center px-4 py-12">
    <div class="w-full max-w-md rounded-card bg-raise p-6 shadow-sm ring-1 ring-line sm:p-8">
      <h1 class="text-2xl font-extrabold tracking-tight text-ink">Reset your password</h1>
      <p class="mt-1 text-sm text-ink-soft">
        Enter your account email and choose a new password. No verification
        needed — the new password works right away.
      </p>

      <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
        <div>
          <label for="forgot-email" class="block text-sm font-semibold text-ink">Email</label>
          <input
            id="forgot-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="field mt-1"
          />
        </div>
        <div>
          <label for="forgot-new-password" class="block text-sm font-semibold text-ink">
            New password
          </label>
          <input
            id="forgot-new-password"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            required
            class="field mt-1"
          />
        </div>
        <div>
          <label for="forgot-confirm-password" class="block text-sm font-semibold text-ink">
            Confirm new password
          </label>
          <input
            id="forgot-confirm-password"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            class="field mt-1"
          />
        </div>

        <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>

        <button type="submit" :disabled="pending" class="btn-accent w-full px-4 py-2.5 text-sm">
          {{ pending ? 'Setting password…' : 'Set new password' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-ink-soft">
        Remembered it after all?
        <RouterLink to="/login" class="font-semibold text-accent hover:text-accent-hover">
          Back to log in
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { backend } from '@/api/backend'
import { getApiErrorMessage } from '@/api/client'
import { useToast } from '@/composables/useToast'

const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref<string | null>(null)
const pending = ref(false)

const router = useRouter()
const { toast } = useToast()

async function submit() {
  error.value = null
  if (!email.value.trim() || !newPassword.value || !confirmPassword.value) {
    error.value = 'Please fill in your email and both password fields.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'New password and confirm password do not match.'
    return
  }
  pending.value = true
  try {
    await backend.forgotPassword({
      email: email.value.trim(),
      new_password: newPassword.value,
      confirm_password: confirmPassword.value,
    })
    toast('Password updated. Log in with your new password.')
    await router.push('/login')
  } catch (err) {
    error.value = getApiErrorMessage(err)
  } finally {
    pending.value = false
  }
}
</script>
