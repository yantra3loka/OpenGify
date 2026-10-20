import type {
  GifPage,
  GifPublic,
  LoginRequest,
  ProfilePublic,
  RegisterRequest,
  ReportResult,
  SearchParams,
  Token,
  UserPublic,
} from './types'
import { mockGifPage, mockGifs, mockUser } from './mocks'

/**
 * Mock implementation of every API function in client.ts, backed by an
 * in-memory store seeded from the contract-shaped mocks. Used ONLY when
 * VITE_USE_MOCKS=true (i.e. until Keval's endpoints are live).
 *
 * Signatures are identical to client.ts — the swap in backend.ts is
 * type-checked, so a drift breaks the build instead of the UI.
 */

const LATENCY_MS = 150
const PAGE_DEFAULT = 20

const delay = () => new Promise<void>((r) => setTimeout(r, LATENCY_MS))

/** Axios-shaped error so getApiErrorMessage() works unchanged. */
function mockError(detail: string, status = 400): unknown {
  return {
    isAxiosError: true,
    message: detail,
    response: { status, data: { detail } },
  }
}

const store: GifPublic[] = mockGifs.map((g) => ({
  ...g,
  tags: [...g.tags],
  uploader: { ...g.uploader },
}))
let nextId = 100

function paginate(items: GifPublic[], page: number, page_size: number): GifPage {
  const start = (page - 1) * page_size
  return {
    items: items.slice(start, start + page_size),
    page,
    page_size,
    total: items.length,
  }
}

export async function registerUser(payload: RegisterRequest): Promise<UserPublic> {
  await delay()
  if (payload.username === 'taken') throw mockError('Username is already taken.')
  return {
    id: 2,
    email: payload.email,
    username: payload.username,
    created_at: new Date().toISOString(),
  }
}

export async function loginUser(payload: LoginRequest): Promise<Token> {
  await delay()
  if (payload.password === 'wrongpassword') {
    throw mockError('Invalid email or password.', 401)
  }
  return { access_token: 'mock-jwt-token', token_type: 'bearer' }
}

export async function fetchGifFeed(page = 1, page_size = PAGE_DEFAULT): Promise<GifPage> {
  await delay()
  const sorted = [...store].sort((a, b) => b.id - a.id)
  return paginate(sorted, page, page_size)
}

export async function searchGifs(params: SearchParams): Promise<GifPage> {
  await delay()
  const q = params.q.trim().toLowerCase()
  const tag = params.tag?.trim().toLowerCase()
  const items = store.filter((g) => {
    const haystack = [g.title, g.description ?? '', ...g.tags].join(' ').toLowerCase()
    const matchesQ = q.length === 0 || haystack.includes(q)
    const matchesTag =
      !tag || tag.length === 0 || g.tags.some((t) => t.toLowerCase() === tag)
    return matchesQ && matchesTag
  })
  return paginate(items, params.page ?? 1, params.page_size ?? PAGE_DEFAULT)
}

export async function fetchTrendingGifs(
  page = 1,
  page_size = PAGE_DEFAULT,
): Promise<GifPage> {
  await delay()
  const sorted = [...store].sort((a, b) => b.like_count - a.like_count)
  return paginate(sorted, page, page_size)
}

export async function fetchGifDetail(gif_id: number): Promise<GifPublic> {
  await delay()
  const gif = store.find((g) => g.id === gif_id)
  if (!gif) throw mockError('GIF not found.', 404)
  gif.view_count += 1 // contract: detail view increments view_count
  return { ...gif, tags: [...gif.tags], uploader: { ...gif.uploader } }
}

export async function uploadGif(input: {
  file: File
  title: string
  description?: string
  tags?: string[]
}): Promise<GifPublic> {
  await delay()
  const id = nextId++
  const gif: GifPublic = {
    id,
    title: input.title,
    description: input.description ?? null,
    tags: input.tags ?? [],
    file_url:
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(input.file)
        : `mock://uploads/${input.file.name}`,
    view_count: 0,
    like_count: 0,
    liked_by_me: false,
    uploader: { username: mockUser.username },
    created_at: new Date().toISOString(),
  }
  store.unshift(gif)
  return { ...gif, tags: [...gif.tags], uploader: { ...gif.uploader } }
}

export async function likeGif(gif_id: number): Promise<GifPublic> {
  await delay()
  const gif = store.find((g) => g.id === gif_id)
  if (!gif) throw mockError('GIF not found.', 404)
  if (!gif.liked_by_me) {
    gif.liked_by_me = true
    gif.like_count += 1
  }
  return { ...gif, tags: [...gif.tags], uploader: { ...gif.uploader } }
}

export async function unlikeGif(gif_id: number): Promise<GifPublic> {
  await delay()
  const gif = store.find((g) => g.id === gif_id)
  if (!gif) throw mockError('GIF not found.', 404)
  if (gif.liked_by_me) {
    gif.liked_by_me = false
    gif.like_count = Math.max(0, gif.like_count - 1)
  }
  return { ...gif, tags: [...gif.tags], uploader: { ...gif.uploader } }
}

export async function reportGif(
  _gif_id: number,
  _reason?: string,
): Promise<ReportResult> {
  await delay()
  return { ok: true }
}

export async function fetchUserProfile(
  username: string,
  page = 1,
  page_size = PAGE_DEFAULT,
): Promise<ProfilePublic> {
  await delay()
  const known = [mockUser.username, ...new Set(store.map((g) => g.uploader.username))]
  if (!known.includes(username)) throw mockError('User not found.', 404)
  const user: UserPublic =
    username === mockUser.username
      ? mockUser
      : {
          id: 3,
          email: `${username}@example.com`,
          username,
          created_at: '2026-10-18T09:00:00Z',
        }
  const gifs = store.filter((g) => g.uploader.username === username)
  return { user, gifs: mockGifPage(gifs, page, page_size) }
}

export async function fetchCurrentUser(): Promise<UserPublic> {
  await delay()
  return mockUser
}

export async function getMyLiked(
  page = 1,
  limit = PAGE_DEFAULT,
): Promise<GifPage> {
  await delay()
  const liked = store.filter((g) => g.liked_by_me)
  return paginate(liked, page, limit)
}
