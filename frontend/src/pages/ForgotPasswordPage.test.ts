import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { backend } from '@/api/backend'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.vue'
import { apiError, flush, mountWithPlugins } from '@/test-utils'

vi.mock('@/api/backend', () => ({
  backend: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    forgotPassword: vi.fn(),
    fetchGifFeed: vi.fn(),
    searchGifs: vi.fn(),
    fetchTrendingGifs: vi.fn(),
    fetchGifDetail: vi.fn(),
    uploadGif: vi.fn(),
    likeGif: vi.fn(),
    unlikeGif: vi.fn(),
    reportGif: vi.fn(),
    fetchUserProfile: vi.fn(),
    fetchCurrentUser: vi.fn(),
    getMyLiked: vi.fn(),
    updateMyProfile: vi.fn(),
    changeMyPassword: vi.fn(),
  },
  isMockMode: false,
}))

async function fillAndSubmit(
  wrapper: VueWrapper,
  email: string,
  newPassword: string,
  confirmPassword: string,
) {
  await wrapper.find('#forgot-email').setValue(email)
  await wrapper.find('#forgot-new-password').setValue(newPassword)
  await wrapper.find('#forgot-confirm-password').setValue(confirmPassword)
  await wrapper.find('form').trigger('submit.prevent')
  await flush()
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the email and both password fields', async () => {
    const { wrapper } = await mountWithPlugins(ForgotPasswordPage, {
      route: '/forgot-password',
    })
    expect(wrapper.find('#forgot-email').exists()).toBe(true)
    expect(wrapper.find('#forgot-new-password').exists()).toBe(true)
    expect(wrapper.find('#forgot-confirm-password').exists()).toBe(true)
  })

  it('mismatched passwords block the submit before any API call', async () => {
    const { wrapper } = await mountWithPlugins(ForgotPasswordPage, {
      route: '/forgot-password',
    })
    await fillAndSubmit(wrapper, 'demo@example.com', 'new-password-1', 'new-password-2')

    expect(vi.mocked(backend.forgotPassword)).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toContain('do not match')
  })

  it('success: calls the endpoint and navigates to /login', async () => {
    vi.mocked(backend.forgotPassword).mockResolvedValue({
      message: 'Password updated successfully',
    })
    const { wrapper, router } = await mountWithPlugins(ForgotPasswordPage, {
      route: '/forgot-password',
    })
    await fillAndSubmit(wrapper, 'demo@example.com', 'new-password-1', 'new-password-1')

    expect(vi.mocked(backend.forgotPassword)).toHaveBeenCalledWith({
      email: 'demo@example.com',
      new_password: 'new-password-1',
      confirm_password: 'new-password-1',
    })
    expect(router.currentRoute.value.fullPath).toBe('/login')
  })

  it('unknown email: the server message is shown on the form', async () => {
    vi.mocked(backend.forgotPassword).mockRejectedValue(
      apiError('No account found with that email address.', 404),
    )
    const { wrapper, router } = await mountWithPlugins(ForgotPasswordPage, {
      route: '/forgot-password',
    })
    await fillAndSubmit(wrapper, 'ghost@example.com', 'new-password-1', 'new-password-1')

    expect(wrapper.find('[role="alert"]').text()).toBe(
      'No account found with that email address.',
    )
    expect(router.currentRoute.value.fullPath).toBe('/forgot-password')
  })
})
