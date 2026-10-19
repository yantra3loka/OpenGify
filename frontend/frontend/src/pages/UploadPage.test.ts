import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { backend } from '@/api/backend'
import { mockGifs } from '@/api/mocks'
import UploadPage from '@/pages/UploadPage.vue'
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
  },
  isMockMode: false,
}))

const TEN_MB = 10 * 1024 * 1024

function gifFile(name = 'fun.gif', size = 1024): File {
  const blob = new Blob([new Uint8Array(size)], { type: 'image/gif' })
  return new File([blob], name, { type: 'image/gif' })
}

async function chooseFile(wrapper: VueWrapper, file: File) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flush()
}

async function submit(wrapper: VueWrapper) {
  await wrapper.find('form').trigger('submit.prevent')
  await flush()
}

describe('UploadPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('requires a file before submitting', async () => {
    const { wrapper } = await mountWithPlugins(UploadPage)
    await wrapper.find('#upload-title').setValue('A title')
    await submit(wrapper)
    expect(wrapper.find('[role="alert"]').text()).toContain('choose a GIF file')
    expect(vi.mocked(backend.uploadGif)).not.toHaveBeenCalled()
  })

  it('rejects non-GIF files', async () => {
    const { wrapper } = await mountWithPlugins(UploadPage)
    const png = new File([new Uint8Array(100)], 'photo.png', { type: 'image/png' })
    await chooseFile(wrapper, png)
    expect(wrapper.find('[role="alert"]').text()).toContain('GIF file')
  })

  it('rejects files over the 10 MB contract limit', async () => {
    const { wrapper } = await mountWithPlugins(UploadPage)
    await chooseFile(wrapper, gifFile('big.gif', TEN_MB + 1))
    expect(wrapper.find('[role="alert"]').text()).toContain('10 MB')
  })

  it('requires a title', async () => {
    const { wrapper } = await mountWithPlugins(UploadPage)
    await chooseFile(wrapper, gifFile())
    // Title is auto-filled from the filename; clear it to test the validation.
    await wrapper.find('#upload-title').setValue('')
    await submit(wrapper)
    expect(wrapper.find('[role="alert"]').text()).toContain('title')
    expect(vi.mocked(backend.uploadGif)).not.toHaveBeenCalled()
  })

  it('uploads a valid GIF with title, description and parsed tags, then opens it', async () => {
    const created = { ...mockGifs[0], id: 101, title: 'My loop' }
    vi.mocked(backend.uploadGif).mockResolvedValue(created)

    const { wrapper, router } = await mountWithPlugins(UploadPage, { route: '/upload' })
    await chooseFile(wrapper, gifFile())
    await wrapper.find('#upload-title').setValue('My loop')
    await wrapper.find('#upload-description').setValue('So smooth')
    await wrapper.find('#upload-tags').setValue('funny,  loop ,,cat')
    await submit(wrapper)

    expect(vi.mocked(backend.uploadGif)).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(backend.uploadGif).mock.calls[0][0]
    expect(payload.title).toBe('My loop')
    expect(payload.description).toBe('So smooth')
    expect(payload.tags).toEqual(['funny', 'loop', 'cat'])
    expect(payload.file).toBeInstanceOf(File)
    expect(router.currentRoute.value.fullPath).toBe('/g/101')
  })

  it('shows the contract { detail } error when the upload fails', async () => {
    vi.mocked(backend.uploadGif).mockRejectedValue({
      isAxiosError: true,
      message: 'File too large',
      response: { status: 400, data: { detail: 'File exceeds 10 MB.' } },
    })
    const { wrapper } = await mountWithPlugins(UploadPage, { route: '/upload' })
    await chooseFile(wrapper, gifFile())
    await wrapper.find('#upload-title').setValue('My loop')
    await submit(wrapper)
    expect(wrapper.find('[role="alert"]').text()).toBe('File exceeds 10 MB.')
  })
})
