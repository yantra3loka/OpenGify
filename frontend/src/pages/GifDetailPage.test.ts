import { beforeEach, describe, expect, it, vi } from 'vitest'
import { backend } from '@/api/backend'
import { mockGifs } from '@/api/mocks'
import GifDetailPage from '@/pages/GifDetailPage.vue'
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

describe('GifDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(backend.fetchGifDetail).mockResolvedValue(gif)
    vi.mocked(backend.reportGif).mockResolvedValue({ ok: true })
  })

  it('renders the full metadata: title, description, uploader, counts, tags', async () => {
    const { wrapper } = await mountWithPlugins(GifDetailPage, { route: '/g/1' })
    await flush()

    expect(vi.mocked(backend.fetchGifDetail)).toHaveBeenCalledWith(1)
    expect(wrapper.text()).toContain(gif.title)
    expect(wrapper.text()).toContain(gif.description)
    expect(wrapper.text()).toContain(`@${gif.uploader.username}`)
    expect(wrapper.text()).toContain(`${gif.view_count} views`)
    for (const tag of gif.tags) expect(wrapper.text()).toContain(`#${tag}`)

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe(gif.file_url)
  })

  it('renders the embed code generator with HTML, Markdown and direct URL', async () => {
    const { wrapper } = await mountWithPlugins(GifDetailPage, { route: '/g/1' })
    await flush()

    expect(wrapper.text()).toContain('Embed this GIF')
    expect(wrapper.text()).toContain('HTML')
    expect(wrapper.text()).toContain('Markdown')
    expect(wrapper.text()).toContain('Direct URL')
    expect(wrapper.text()).toContain(gif.file_url)
  })

  it('shows a not-found message when the GIF does not exist', async () => {
    vi.mocked(backend.fetchGifDetail).mockRejectedValue(apiError('GIF not found.', 404))
    const { wrapper } = await mountWithPlugins(GifDetailPage, { route: '/g/999' })
    await flush()
    expect(wrapper.text()).toContain('GIF not found.')
  })

  it('records a report with an optional reason', async () => {
    const { wrapper } = await mountWithPlugins(GifDetailPage, { route: '/g/1' })
    await flush()

    await wrapper.find('input[aria-label="Report reason"]').setValue('spam')
    await wrapper.find('section form').trigger('submit.prevent')
    await flush()

    expect(vi.mocked(backend.reportGif)).toHaveBeenCalledWith(1, 'spam')
    expect(wrapper.text()).toContain('report has been recorded')
  })
})
