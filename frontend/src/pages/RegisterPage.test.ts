import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { backend } from '@/api/backend'
import { clearAccessToken, getAccessToken } from '@/api/client'
import { useAuth } from '@/api/useAuth'
import RegisterPage from '@/pages/RegisterPage.vue'
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

async function fill(
  wrapper: VueWrapper,
  values: { email: string; username: string; password: string; confirm: string },
) {
  await wrapper.find('#reg-email').setValue(values.email)
  await wrapper.find('#reg-username').setValue(values.username)
  await wrapper.find('#reg-password').setValue(values.password)
  await wrapper.find('#reg-confirm').setValue(values.confirm)
  await wrapper.find('form').trigger('submit.prevent')
  await flush()
}

const valid = {
  email: 'piyush@example.com',
  username: 'piyush',
  password: 'password123',
  confirm: 'password123',
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAuth()
  })

  it('rejects an invalid email', async () => {
    const { wrapper } = await mountWithPlugins(RegisterPage)
    await fill(wrapper, { ...valid, email: 'not-an-email' })
    expect(wrapper.find('[role="alert"]').text()).toContain('valid email')
    expect(vi.mocked(backend.registerUser)).not.toHaveBeenCalled()
  })

  it('rejects a username shorter than 3 characters (contract: minLength 3)', async () => {
    const { wrapper } = await mountWithPlugins(RegisterPage)
    await fill(wrapper, { ...valid, username: 'ab' })
    expect(wrapper.find('[role="alert"]').text()).toContain('3–30 characters')
    expect(vi.mocked(backend.registerUser)).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 8 characters (contract: minLength 8)', async () => {
    const { wrapper } = await mountWithPlugins(RegisterPage)
    await fill(wrapper, { ...valid, password: 'short', confirm: 'short' })
    expect(wrapper.find('[role="alert"]').text()).toContain('at least 8 characters')
    expect(vi.mocked(backend.registerUser)).not.toHaveBeenCalled()
  })

  it('rejects mismatched password confirmation', async () => {
    const { wrapper } = await mountWithPlugins(RegisterPage)
    await fill(wrapper, { ...valid, confirm: 'different123' })
    expect(wrapper.find('[role="alert"]').text()).toContain('do not match')
    expect(vi.mocked(backend.registerUser)).not.toHaveBeenCalled()
  })

  it('registers, logs in (contract returns no tokens on register) and redirects home', async () => {
    vi.mocked(backend.registerUser).mockResolvedValue({
      id: 7,
      email: valid.email,
      username: valid.username,
      created_at: '2026-10-19T00:00:00Z',
    })
    vi.mocked(backend.loginUser).mockResolvedValue({
      access_token: 'jwt-new',
      token_type: 'bearer',
    })

    const { wrapper, router } = await mountWithPlugins(RegisterPage)
    await fill(wrapper, valid)

    expect(vi.mocked(backend.registerUser)).toHaveBeenCalledWith({
      email: valid.email,
      username: valid.username,
      password: valid.password,
    })
    // Auto-login after register, since the contract's 201 carries no tokens.
    expect(vi.mocked(backend.loginUser)).toHaveBeenCalledWith({
      email: valid.email,
      password: valid.password,
    })
    expect(getAccessToken()).toBe('jwt-new')
    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('shows the contract { detail } error when the username is taken', async () => {
    vi.mocked(backend.registerUser).mockRejectedValue(
      apiError('Username is already taken.'),
    )
    const { wrapper } = await mountWithPlugins(RegisterPage)
    await fill(wrapper, valid)
    expect(wrapper.find('[role="alert"]').text()).toBe('Username is already taken.')
    expect(getAccessToken()).toBeNull()
  })
})
