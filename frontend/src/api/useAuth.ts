import { computed, ref } from 'vue'
import { backend } from './backend'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './client'
import type { LoginRequest, RegisterRequest, UserPublic } from './types'

/**
 * Minimal auth state — a plain composable, no store library.
 * Whether we adopt Pinia is a Day-2 team decision; this keeps
 * Day 1 dependency-free while auth screens are built.
 */
const token = ref<string | null>(getAccessToken())
const currentUser = ref<UserPublic | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => token.value !== null)

  async function login(payload: LoginRequest): Promise<void> {
    const { access_token } = await backend.loginUser(payload)
    setAccessToken(access_token)
    token.value = access_token
  }

  async function register(payload: RegisterRequest): Promise<UserPublic> {
    // Contract: register returns 201 UserPublic WITHOUT tokens,
    // so we log in immediately after a successful registration.
    const user = await backend.registerUser(payload)
    await login({ email: payload.email, password: payload.password })
    currentUser.value = user
    return user
  }

  function logout(): void {
    clearAccessToken()
    token.value = null
    currentUser.value = null
  }

  /**
   * Resolve who owns the stored token (register sets currentUser
   * directly; a plain login doesn't). Failures are swallowed —
   * callers simply keep currentUser null (e.g. no profile chip).
   */
  async function refreshCurrentUser(): Promise<void> {
    if (!token.value || currentUser.value) return
    try {
      currentUser.value = await backend.fetchCurrentUser()
    } catch {
      /* stay anonymous-looking until the next successful call */
    }
  }

  return {
    token,
    currentUser,
    isAuthenticated,
    login,
    register,
    logout,
    refreshCurrentUser,
  }
}
