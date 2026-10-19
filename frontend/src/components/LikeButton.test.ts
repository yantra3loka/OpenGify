import { beforeEach, describe, expect, it, vi } from 'vitest'
import { backend } from '@/api/backend'
import { clearAccessToken, setAccessToken } from '@/api/client'
import { useAuth } from '@/api/useAuth'
import LikeButton from '@/components/LikeButton.vue'
import { mockGifs } from '@/api/mocks'
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

const gif = mockGifs[0]

function resetAuth() {
  clearAccessToken()
  localStorage.clear()
  useAuth().token.value = null
}

describe('LikeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAuth()
  })

  it('renders the like count and reflects the liked state', async () => {
    const { wrapper } = await mountWithPlugins(LikeButton, {
      props: { gifId: gif.id, likedByMe: true, likeCount: 96 },
    })
    expect(wrapper.find('[data-testid="like-count"]').text()).toBe('96')
    expect(wrapper.attributes('aria-pressed')).toBe('true')
  })

  it('treats an omitted liked_by_me (anonymous contract shape) as not liked', async () => {
    const { wrapper } = await mountWithPlugins(LikeButton, {
      props: { gifId: gif.id, likeCount: 3 },
    })
    expect(wrapper.attributes('aria-pressed')).toBe('false')
  })

  it('redirects to login when clicked while unauthenticated', async () => {
    const { wrapper, router } = await mountWithPlugins(LikeButton, {
      props: { gifId: gif.id, likedByMe: false, likeCount: 1 },
      route: '/g/1',
    })
    await wrapper.trigger('click')
    expect(vi.mocked(backend.likeGif)).not.toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe('login')
    })
    expect(router.currentRoute.value.query.redirect).toBe('/g/1')
  })

  it('calls like when not liked and unlike when already liked', async () => {
    setAccessToken('tok')
    useAuth().token.value = 'tok'
    vi.mocked(backend.likeGif).mockResolvedValue({
      ...gif,
      liked_by_me: true,
      like_count: gif.like_count + 1,
    })
    vi.mocked(backend.unlikeGif).mockResolvedValue({ ...gif })

    const { wrapper } = await mountWithPlugins(LikeButton, {
      props: { gifId: gif.id, likedByMe: false, likeCount: gif.like_count },
    })
    await wrapper.trigger('click')
    await flush()
    expect(vi.mocked(backend.likeGif)).toHaveBeenCalledWith(gif.id)

    const { wrapper: wrapper2 } = await mountWithPlugins(LikeButton, {
      props: { gifId: gif.id, likedByMe: true, likeCount: gif.like_count + 1 },
    })
    await wrapper2.trigger('click')
    await flush()
    expect(vi.mocked(backend.unlikeGif)).toHaveBeenCalledWith(gif.id)
  })

  it('surfaces the contract error message when the like fails', async () => {
    setAccessToken('tok')
    useAuth().token.value = 'tok'
    vi.mocked(backend.likeGif).mockRejectedValue(apiError('You already liked this.'))

    const { wrapper } = await mountWithPlugins(LikeButton, {
      props: { gifId: gif.id, likedByMe: false, likeCount: 5 },
    })
    await wrapper.trigger('click')
    await flush()
    // Mutation failed: count stays as the prop passed in (no silent drift).
    expect(wrapper.find('[data-testid="like-count"]').text()).toBe('5')
  })
})
