import type { GifPage, GifPublic, ProfilePublic, UserPublic } from './types'

/**
 * Contract-shaped mock data. Used ONLY until Keval's endpoints are live —
 * every mock matches openapi.yaml exactly, so swapping to the real API
 * means deleting the mock, not reshaping the UI.
 */

const at = (iso: string) => iso

export const mockUser: UserPublic = {
  id: 1,
  email: 'piyush@example.com',
  username: 'piyush',
  created_at: at('2026-10-19T09:00:00Z'),
}

const gif = (over: Partial<GifPublic> & { id: number; title: string }): GifPublic => ({
  description: null,
  tags: [],
  file_url: `http://localhost:8000/uploads/sample-${over.id}.gif`,
  view_count: 0,
  like_count: 0,
  liked_by_me: false,
  uploader: { username: 'piyush' },
  created_at: at('2026-10-19T09:00:00Z'),
  ...over,
})

export const mockGifs: GifPublic[] = [
  gif({
    id: 1,
    title: 'Excited cat typing',
    description: 'A very productive cat.',
    tags: ['cat', 'funny', 'typing'],
    view_count: 1284,
    like_count: 96,
    liked_by_me: true,
    uploader: { username: 'keval' },
  }),
  gif({
    id: 2,
    title: 'Rocket launch loop',
    tags: ['space', 'loop'],
    view_count: 842,
    like_count: 61,
    uploader: { username: 'piyush' },
  }),
  gif({
    id: 3,
    title: 'Dancing robot',
    description: 'Beep boop.',
    tags: ['robot', 'dance', 'funny'],
    view_count: 2310,
    like_count: 187,
    liked_by_me: false,
  }),
  gif({
    id: 4,
    title: 'Coffee pour slow-mo',
    tags: ['coffee', 'morning'],
    view_count: 312,
    like_count: 24,
    uploader: { username: 'keval' },
  }),
]

export function mockGifPage(
  items: GifPublic[] = mockGifs,
  page = 1,
  page_size = 20,
): GifPage {
  return { items, page, page_size, total: items.length }
}

export const mockProfile: ProfilePublic = {
  user: mockUser,
  gifs: mockGifPage(mockGifs.filter((g) => g.uploader.username === 'piyush')),
}
