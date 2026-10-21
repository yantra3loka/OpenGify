import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { backend } from '@/api/backend'
import { clearAccessToken, getAccessToken } from '@/api/client'
import { useAuth } from '@/api/useAuth'
import LoginPage from '@/pages/LoginPage.vue'
import { apiError, flush, mountWithPlugins } from '@/test-utils'

vi.mock('@/api/backend', () => ({
  backend: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    fetchGifFeed: vi.fn(),
    searchGifs: vi.fn(),
    fetchTrendingGifs: vi.fn(),
    fetchGifDetail: vi.fn(),
    uploadGif: vi.fn(),
    likeGif: vi.fn(),
    unlikeGif: vi.fn(),
    reportGif: vi.fn(),
    fetchUserProfile: vi.fn(),
  },
  isMockMode: false,
}))

function resetAuth() {
  clearAccessToken()
  localStorage.clear()
  useAuth().token.value = null
}

async function fillAndSubmit(wrapper: VueWrapper, email: string, password: string) {
  await wrapper.find('#login-email').setValue(email)
  await wrapper.find('#login-password').setValue(password)
  await wrapper.find('form').trigger('submit.prevent')
  await flush()
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAuth()
  })

  it('renders the login form', async () => {
    const { wrapper } = await mountWithPlugins(LoginPage)
    expect(wrapper.find('#login-email').exists()).toBe(true)
    expect(wrapper.find('#login-password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('links to the forgot-password page', async () => {
    const { wrapper } = await mountWithPlugins(LoginPage)
    const link = wrapper.findAll('a').find((a) => a.text() === 'Forgot password?')
    expect(link).toBeDefined()
    expect(link!.attributes('href')).toBe('/forgot-password')
  })

  it('shows a validation message on empty submit', async () => {
    const { wrapper } = await mountWithPlugins(LoginPage)
    // The form ships pre-filled with the demo account; clear both fields
    // so this still exercises the empty-form validation path.
    await wrapper.find('#login-email').setValue('')
    await wrapper.find('#login-password').setValue('')
    await wrapper.find('form').trigger('submit.prevent')
    await flush()
    expect(wrapper.find('[role="alert"]').text()).toContain('email and password')
    expect(vi.mocked(backend.loginUser)).not.toHaveBeenCalled()
  })

  it('stores the token and redirects on successful login', async () => {
    vi.mocked(backend.loginUser).mockResolvedValue({
      access_token: 'jwt-abc',
      token_type: 'bearer',
    })
    const { wrapper, router } = await mountWithPlugins(LoginPage, {
      route: '/login?redirect=/upload',
    })
    await fillAndSubmit(wrapper, 'piyush@example.com', 'password123')

    expect(vi.mocked(backend.loginUser)).toHaveBeenCalledWith({
      email: 'piyush@example.com',
      password: 'password123',
    })
    expect(getAccessToken()).toBe('jwt-abc')
    expect(router.currentRoute.value.fullPath).toBe('/upload')
  })

  it('shows the contract { detail } error when login fails', async () => {
    vi.mocked(backend.loginUser).mockRejectedValue(
      apiError('Invalid email or password.', 401),
    )
    const { wrapper } = await mountWithPlugins(LoginPage)
    await fillAndSubmit(wrapper, 'piyush@example.com', 'nope')

    expect(wrapper.find('[role="alert"]').text()).toBe('Invalid email or password.')
    expect(getAccessToken()).toBeNull()
  })
})
