import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { backend } from '@/api/backend'
import { gifKeys, useToggleLike } from '@/api/queries'
import { mockGifPage, mockGifs } from '@/api/mocks'
import type { GifPage } from '@/api/types'
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

const gif = mockGifs[1] // not liked in mocks

/** Harness exposing the mutation so the test can drive it. */
function harness() {
  let mutate!: ReturnType<typeof useToggleLike>['mutate']
  let mutateAsync!: ReturnType<typeof useToggleLike>['mutateAsync']
  const Comp = defineComponent({
    setup() {
      const m = useToggleLike()
      mutate = m.mutate
      mutateAsync = m.mutateAsync
      return () => h('div')
    },
  })
  return { Comp, getMutate: () => mutate, getMutateAsync: () => mutateAsync }
}

describe('useToggleLike (optimistic updates)', () => {
  it('flips liked_by_me and like_count in the feed cache immediately', async () => {
    const { Comp, getMutateAsync } = harness()
    const { queryClient } = await mountWithPlugins(Comp)

    const page: GifPage = mockGifPage([gif])
    queryClient.setQueryData(gifKeys.feed(), {
      pages: [page],
      pageParams: [1],
    })
    queryClient.setQueryData(gifKeys.detail(gif.id), gif)

    vi.mocked(backend.likeGif).mockImplementation(async () => {
      await flush(20)
      return { ...gif, liked_by_me: true, like_count: gif.like_count + 1 }
    })

    const promise = getMutateAsync()({ id: gif.id, liked: false })
    await flush() // let onMutate run, but not the server response

    const feedCache = queryClient.getQueryData<{ pages: GifPage[] }>(gifKeys.feed())
    const cached = feedCache!.pages[0].items[0]
    expect(cached.liked_by_me).toBe(true)
    expect(cached.like_count).toBe(gif.like_count + 1)

    const detailCache = queryClient.getQueryData(gifKeys.detail(gif.id))
    expect(detailCache).toMatchObject({ liked_by_me: true })

    await promise
    await flush()
    // After settle the cache is invalidated & consistent — no rollback happened.
    expect(vi.mocked(backend.likeGif)).toHaveBeenCalledWith(gif.id)
  })

  it('rolls back the optimistic flip when the server rejects', async () => {
    const { Comp, getMutate } = harness()
    const { queryClient } = await mountWithPlugins(Comp)

    queryClient.setQueryData(gifKeys.detail(gif.id), gif)
    vi.mocked(backend.likeGif).mockRejectedValue(new Error('boom'))

    getMutate()({ id: gif.id, liked: false })
    await flush(50)

    const detailCache = queryClient.getQueryData(gifKeys.detail(gif.id))
    expect(detailCache).toMatchObject({
      liked_by_me: gif.liked_by_me,
      like_count: gif.like_count,
    })
  })
})
