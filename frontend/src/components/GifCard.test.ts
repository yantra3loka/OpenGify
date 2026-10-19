import { describe, expect, it, vi } from 'vitest'
import GifCard from '@/components/GifCard.vue'
import { mockGifs } from '@/api/mocks'
import { mountWithPlugins } from '@/test-utils'

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

describe('GifCard', () => {
  it('renders title, uploader, tags, counts and the GIF image', async () => {
    const { wrapper } = await mountWithPlugins(GifCard, { props: { gif } })

    expect(wrapper.text()).toContain(gif.title)
    expect(wrapper.text()).toContain(`@${gif.uploader.username}`)
    expect(wrapper.text()).toContain(`${gif.view_count} views`)
    for (const tag of gif.tags) expect(wrapper.text()).toContain(`#${tag}`)

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe(gif.file_url)
    expect(img.attributes('alt')).toBe(gif.title)
    expect(img.attributes('loading')).toBe('lazy')
  })

  it('links the card to the detail page and the uploader to their profile', async () => {
    const { wrapper, router } = await mountWithPlugins(GifCard, { props: { gif } })

    const detailLink = wrapper
      .findAll('a')
      .find((a) => a.attributes('href') === `/g/${gif.id}`)
    expect(detailLink).toBeTruthy()

    const profileLink = wrapper
      .findAll('a')
      .find((a) => a.attributes('href') === `/u/${gif.uploader.username}`)
    expect(profileLink).toBeTruthy()
    expect(router).toBeTruthy()
  })

  it('embeds the like button with the GIF like state', async () => {
    const { wrapper } = await mountWithPlugins(GifCard, { props: { gif } })
    const likeButton = wrapper.find('[aria-label="Unlike this GIF"]')
    expect(likeButton.exists()).toBe(true)
    expect(likeButton.text()).toContain(String(gif.like_count))
  })
})
