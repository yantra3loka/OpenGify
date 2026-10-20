import { beforeEach, describe, expect, it, vi } from 'vitest'
import { backend } from '@/api/backend'
import { mockGifs, mockProfile, mockUser } from '@/api/mocks'
import type { UserPublic } from '@/api/types'
import ProfilePage from '@/pages/ProfilePage.vue'
import { flush, mountWithPlugins } from '@/test-utils'

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
    fetchCurrentUser: vi.fn(),
    getMyLiked: vi.fn(),
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
})
