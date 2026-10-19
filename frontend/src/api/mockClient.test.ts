import { describe, expect, it } from 'vitest'
import {
  fetchGifDetail,
  fetchGifFeed,
  fetchTrendingGifs,
  likeGif,
  loginUser,
  registerUser,
  searchGifs,
  unlikeGif,
  uploadGif,
} from './mockClient'

/**
 * The mock backend is the frontend's stand-in for Keval's API until it
 * goes live — these tests pin its contract-shaped behavior so the demo
 * path (register → login → upload → like) keeps working.
 */
describe('mockClient', () => {
  it('registers and logs in with contract shapes', async () => {
    const user = await registerUser({
      email: 'a@b.c',
      username: 'tester',
      password: 'password123',
    })
    expect(user.username).toBe('tester')
    expect(typeof user.id).toBe('number')

    const token = await loginUser({ email: 'a@b.c', password: 'password123' })
    expect(typeof token.access_token).toBe('string')
    expect(token.token_type).toBe('bearer')
  })

  it('rejects a bad login with the contract { detail } shape', async () => {
    await expect(
      loginUser({ email: 'a@b.c', password: 'wrongpassword' }),
    ).rejects.toMatchObject({ response: { data: { detail: expect.any(String) } } })
  })

  it('paginates the feed newest-first', async () => {
    const p1 = await fetchGifFeed(1, 2)
    expect(p1.page).toBe(1)
    expect(p1.page_size).toBe(2)
    expect(p1.items).toHaveLength(2)
    expect(p1.total).toBeGreaterThanOrEqual(2)
    const p2 = await fetchGifFeed(2, 2)
    expect(p2.items[0].id).not.toBe(p1.items[0].id)
  })

  it('searches by text and filters by exact tag', async () => {
    const byText = await searchGifs({ q: 'cat' })
    expect(byText.items.length).toBeGreaterThan(0)
    expect(
      byText.items.every((g) =>
        [g.title, g.description ?? '', ...g.tags].join(' ').toLowerCase().includes('cat'),
      ),
    ).toBe(true)

    const byTag = await searchGifs({ q: '', tag: 'space' })
    expect(byTag.items.length).toBeGreaterThan(0)
    expect(byTag.items.every((g) => g.tags.includes('space'))).toBe(true)
  })

  it('ranks trending by like_count', async () => {
    const trending = await fetchTrendingGifs(1, 10)
    const counts = trending.items.map((g) => g.like_count)
    expect([...counts].sort((a, b) => b - a)).toEqual(counts)
  })

  it('increments view_count on detail and toggles likes', async () => {
    const before = await fetchGifDetail(2)
    const after = await fetchGifDetail(2)
    expect(after.view_count).toBe(before.view_count + 1)

    const liked = await likeGif(2)
    expect(liked.liked_by_me).toBe(true)
    expect(liked.like_count).toBe(after.like_count + 1)

    const unliked = await unlikeGif(2)
    expect(unliked.liked_by_me).toBe(false)
    expect(unliked.like_count).toBe(after.like_count)
  })

  it('creates an uploaded GIF with the contract shape', async () => {
    const file = new File([new Uint8Array(10)], 'demo.gif', { type: 'image/gif' })
    const gif = await uploadGif({ file, title: 'Demo', tags: ['demo'] })
    expect(gif.title).toBe('Demo')
    expect(gif.tags).toEqual(['demo'])
    expect(typeof gif.file_url).toBe('string')
    expect(gif.view_count).toBe(0)
    expect(gif.like_count).toBe(0)

    const feed = await fetchGifFeed(1, 50)
    expect(feed.items.some((g) => g.id === gif.id)).toBe(true)
  })
})
