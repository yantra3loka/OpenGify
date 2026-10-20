import axios, { type AxiosError } from 'axios'
import type {
  ApiError,
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

/**
 * Base URL comes from the frozen contract (servers[0].url).
 * Override per-environment with VITE_API_URL, e.g. staging builds.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/**
 * The API returns file_url as a path relative to the API origin
 * (e.g. "/uploads/x.gif") and serves /uploads statically (Keval,
 * Day 2). Resolve it against the API base URL so <img> tags and
 * embed codes point at the backend, not the frontend origin.
 * Absolute URLs pass through unchanged.
 */
export function resolveFileUrl(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
  return `${API_BASE_URL}${path}`
}

const TOKEN_KEY = 'opengiphy.access_token'

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

let unauthorizedHandler: (() => void) | null = null

/** App wiring (main.ts) registers what a 401 means: drop auth state, go to /login. */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    // Keval (Day 2): access tokens live 24h, there is no refresh token,
    // so a 401 means "log in again". Auth endpoints are exempt: a failed
    // login is itself a 401 and must surface as a form error, not a redirect.
    if (status === 401 && !url.includes('/auth/') && getAccessToken()) {
      clearAccessToken()
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

/** Extract the contract's { detail } message from any axios failure. */
export function getApiErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<ApiError>
  const detail = axiosErr?.response?.data?.detail
  if (typeof detail === 'string' && detail.length > 0) return detail
  if (axiosErr?.message) return axiosErr.message
  return 'Something went wrong. Please try again.'
}

/* ---------------- Auth ---------------- */

export async function registerUser(payload: RegisterRequest): Promise<UserPublic> {
  const { data } = await api.post<UserPublic>('/auth/register', payload)
  return data
}

/** Login returns a JWT; the caller stores it via setAccessToken(). */
export async function loginUser(payload: LoginRequest): Promise<Token> {
  const { data } = await api.post<Token>('/auth/login', payload)
  return data
}

/* ---------------- GIFs ---------------- */

export async function fetchGifFeed(page = 1, page_size = 20): Promise<GifPage> {
  const { data } = await api.get<GifPage>('/gifs', { params: { page, page_size } })
  return data
}

export async function searchGifs(params: SearchParams): Promise<GifPage> {
  const { data } = await api.get<GifPage>('/gifs/search', { params })
  return data
}

export async function fetchTrendingGifs(page = 1, page_size = 20): Promise<GifPage> {
  const { data } = await api.get<GifPage>('/gifs/trending', {
    params: { page, page_size },
  })
  return data
}

export async function fetchGifDetail(gif_id: number): Promise<GifPublic> {
  const { data } = await api.get<GifPublic>(`/gifs/${gif_id}`)
  return data
}

/**
 * Upload a GIF as multipart/form-data per the contract.
 * Tags go as ONE comma-separated `tags` field (confirmed by Keval,
 * Day 2); responses return tags as a JSON array.
 */
export async function uploadGif(input: {
  file: File
  title: string
  description?: string
  tags?: string[]
}): Promise<GifPublic> {
  const form = new FormData()
  form.append('file', input.file)
  form.append('title', input.title)
  if (input.description) form.append('description', input.description)
  if (input.tags && input.tags.length > 0) {
    form.append('tags', input.tags.join(','))
  }
  const { data } = await api.post<GifPublic>('/gifs', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function likeGif(gif_id: number): Promise<GifPublic> {
  const { data } = await api.post<GifPublic>(`/gifs/${gif_id}/like`)
  return data
}

export async function unlikeGif(gif_id: number): Promise<GifPublic> {
  const { data } = await api.delete<GifPublic>(`/gifs/${gif_id}/like`)
  return data
}

export async function reportGif(gif_id: number, reason?: string): Promise<ReportResult> {
  const { data } = await api.post<ReportResult>(`/gifs/${gif_id}/report`, { reason })
  return data
}

/* ---------------- Users ---------------- */

export async function fetchUserProfile(
  username: string,
  page = 1,
  page_size = 20,
): Promise<ProfilePublic> {
  const { data } = await api.get<ProfilePublic>(`/users/${username}`, {
    params: { page, page_size },
  })
  return data
}

/** The logged-in user (backend's GET /auth/me; bearer attached by the interceptor). */
export async function fetchCurrentUser(): Promise<UserPublic> {
  const { data } = await api.get<UserPublic>('/auth/me')
  return data
}

/**
 * GIFs the logged-in user has liked, most-recently-liked first
 * (GET /users/me/liked). The endpoint takes a `limit` query param
 * but returns the standard GifPage body, so it drops straight into
 * the existing infinite-scroll grid.
 */
export async function getMyLiked(page = 1, limit = 20): Promise<GifPage> {
  const { data } = await api.get<GifPage>('/users/me/liked', {
    params: { page, limit },
  })
  return data
}
