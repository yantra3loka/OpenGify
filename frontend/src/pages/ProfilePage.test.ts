import { beforeEach, describe, expect, it, vi } from 'vitest'
import { backend } from '@/api/backend'
import { mockGifs, mockProfile, mockUser } from '@/api/mocks'
import type { UserPublic } from '@/api/types'
import ProfilePage from '@/pages/ProfilePage.vue'
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

const auth = await vi.hoisted(async () => {
  const { ref } = await import('vue')
  return { currentUser: ref<UserPublic | null>(null) }
})

vi.mock('@/api/useAuth', () => ({
  useAuth: () => ({ currentUser: auth.currentUser }),
}))

const likedGif = mockGifs[0] // liked_by_me in the mocks

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.currentUser.value = mockUser
    vi.mocked(backend.fetchUserProfile).mockResolvedValue(mockProfile)
    vi.mocked(backend.getMyLiked).mockResolvedValue({
      items: [likedGif],
      page: 1,
      page_size: 20,
      total: 1,
    })
  })

  it('own profile: shows email, stats and Uploads/Liked tabs; Liked lists my liked GIFs', async () => {
    const { wrapper } = await mountWithPlugins(ProfilePage, {
      route: `/u/${mockUser.username}`,
    })
    await flush()
    await flush()

    expect(wrapper.text()).toContain(`@${mockUser.username}`)
    expect(wrapper.text()).toContain(mockUser.email)
    expect(wrapper.text()).toContain('Likes received')
    expect(wrapper.text()).toContain('Likes given')

    const tabLabels = wrapper.findAll('[role="tab"]').map((b) => b.text())
    expect(tabLabels).toEqual(['Uploads', 'Liked'])
    expect(vi.mocked(backend.getMyLiked)).toHaveBeenCalled()

    const likedTab = wrapper.findAll('[role="tab"]').find((b) => b.text() === 'Liked')
    await likedTab!.trigger('click')
    await flush()
    await flush()

    expect(wrapper.text()).toContain(likedGif.title)
  })

  it('own profile: empty Liked tab shows the empty state', async () => {
    vi.mocked(backend.getMyLiked).mockResolvedValue({
      items: [],
      page: 1,
      page_size: 20,
      total: 0,
    })
    const { wrapper } = await mountWithPlugins(ProfilePage, {
      route: `/u/${mockUser.username}`,
    })
    await flush()
    await flush()

    const likedTab = wrapper.findAll('[role="tab"]').find((b) => b.text() === 'Liked')
    await likedTab!.trigger('click')
    await flush()
    await flush()

    expect(wrapper.text()).toContain('No liked GIFs yet.')
  })

  it("another user's profile: no email, no tabs, liked endpoint never called", async () => {
    const other: UserPublic = {
      id: 4,
      email: 'keval@example.com',
      username: 'keval',
      created_at: '2026-10-18T09:00:00Z',
    }
    vi.mocked(backend.fetchUserProfile).mockResolvedValue({
      user: other,
      gifs: {
        items: mockGifs.filter((g) => g.uploader.username === 'keval'),
        page: 1,
        page_size: 20,
        total: 2,
      },
    })

    const { wrapper } = await mountWithPlugins(ProfilePage, { route: '/u/keval' })
    await flush()
    await flush()

    expect(wrapper.text()).toContain('@keval')
    expect(wrapper.text()).not.toContain('keval@example.com')
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('Likes given')
    expect(vi.mocked(backend.getMyLiked)).not.toHaveBeenCalled()
  })

  it('own profile: Edit profile section is shown with the username prefilled', async () => {
    const { wrapper } = await mountWithPlugins(ProfilePage, {
      route: `/u/${mockUser.username}`,
    })
    await flush()
    await flush()

    expect(wrapper.text()).toContain('Edit profile')
    expect(wrapper.text()).toContain('Change password')
    const input = wrapper.find('#edit-username')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe(mockUser.username)
  })

  it("another user's profile: no Edit profile section", async () => {
    const other: UserPublic = {
      id: 4,
      email: 'keval@example.com',
      username: 'keval',
      created_at: '2026-10-18T09:00:00Z',
    }
    vi.mocked(backend.fetchUserProfile).mockResolvedValue({
      user: other,
      gifs: { items: [], page: 1, page_size: 20, total: 0 },
    })

    const { wrapper } = await mountWithPlugins(ProfilePage, { route: '/u/keval' })
    await flush()
    await flush()

    expect(wrapper.text()).not.toContain('Edit profile')
    expect(wrapper.find('#edit-username').exists()).toBe(false)
  })

  it('rename success: calls the API, updates auth state, navigates to the new profile URL', async () => {
    vi.mocked(backend.updateMyProfile).mockResolvedValue({
      ...mockUser,
      username: 'piyush2',
    })
    const { wrapper, router } = await mountWithPlugins(ProfilePage, {
      route: `/u/${mockUser.username}`,
    })
    await flush()
    await flush()

    await wrapper.find('#edit-username').setValue('piyush2')
    await wrapper.findAll('form')[0].trigger('submit.prevent')
    await flush()
    await flush()

    expect(vi.mocked(backend.updateMyProfile)).toHaveBeenCalledWith({
      username: 'piyush2',
    })
    expect(auth.currentUser.value?.username).toBe('piyush2')
    expect(router.currentRoute.value.fullPath).toBe('/u/piyush2')
  })

  it('rename with a taken name: the server error shows on the form', async () => {
    vi.mocked(backend.updateMyProfile).mockRejectedValue(
      apiError('Username already taken.', 409),
    )
    const { wrapper } = await mountWithPlugins(ProfilePage, {
      route: `/u/${mockUser.username}`,
    })
    await flush()
    await flush()

    await wrapper.find('#edit-username').setValue('taken')
    await wrapper.findAll('form')[0].trigger('submit.prevent')
    await flush()
    await flush()

    const alerts = wrapper.findAll('[role="alert"]').map((a) => a.text())
    expect(alerts).toContain('Username already taken.')
    expect(auth.currentUser.value?.username).toBe(mockUser.username)
  })

  it('change password with a wrong current password: the server error shows on the form', async () => {
    vi.mocked(backend.changeMyPassword).mockRejectedValue(
      apiError('Current password is incorrect.', 400),
    )
    const { wrapper } = await mountWithPlugins(ProfilePage, {
      route: `/u/${mockUser.username}`,
    })
    await flush()
    await flush()

    await wrapper.find('#edit-current-password').setValue('wrongpassword')
    await wrapper.find('#edit-new-password').setValue('brand-new-pass')
    await wrapper.find('#edit-confirm-password').setValue('brand-new-pass')
    await wrapper.findAll('form')[1].trigger('submit.prevent')
    await flush()
    await flush()

    expect(vi.mocked(backend.changeMyPassword)).toHaveBeenCalledWith({
      current_password: 'wrongpassword',
      new_password: 'brand-new-pass',
      confirm_password: 'brand-new-pass',
    })
    const alerts = wrapper.findAll('[role="alert"]').map((a) => a.text())
    expect(alerts).toContain('Current password is incorrect.')
  })

  it('change password with mismatched new passwords is blocked client-side', async () => {
    const { wrapper } = await mountWithPlugins(ProfilePage, {
      route: `/u/${mockUser.username}`,
    })
    await flush()
    await flush()

    await wrapper.find('#edit-current-password').setValue('password123')
    await wrapper.find('#edit-new-password').setValue('brand-new-pass')
    await wrapper.find('#edit-confirm-password').setValue('different-pass')
    await wrapper.findAll('form')[1].trigger('submit.prevent')
    await flush()

    expect(vi.mocked(backend.changeMyPassword)).not.toHaveBeenCalled()
    const alerts = wrapper.findAll('[role="alert"]').map((a) => a.text())
    expect(alerts.some((t) => t.includes('do not match'))).toBe(true)
  })
})
