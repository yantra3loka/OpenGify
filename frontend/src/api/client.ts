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
 * Tags are sent as repeated `tags` form fields. If Keval's backend
 * only accepts the comma-separated variant, change this one place.
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
  for (const tag of input.tags ?? []) form.append('tags', tag)
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
