/**
 * TypeScript types generated from openapi.yaml (OpenGIPHY API v1.0.0).
 *
 * These types are hand-written to match the frozen contract EXACTLY.
 * If the contract changes, update this file first, then the code.
 * Never "fix" a mismatch by reshaping data silently — raise it in the sync.
 */

/* ---------------- Auth ---------------- */

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

/** POST /auth/forgot-password — no verification step by design. */
export interface ForgotPasswordRequest {
  email: string
  new_password: string
  confirm_password: string
}

/** PATCH /users/me — rename the logged-in user. */
export interface UpdateProfileRequest {
  username: string
}

/** POST /users/me/change-password. */
export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

/** Simple { message } success body (password endpoints). */
export interface MessageResponse {
  message: string
}

/** Returned by POST /auth/login. NOTE: contract calls it a "token pair"
 *  but the schema only carries access_token — no refresh_token. */
export interface Token {
  access_token: string
  token_type: string
}

export interface UserPublic {
  id: number
  email: string
  username: string
  created_at: string
}

/* ---------------- GIFs ---------------- */

export interface UploaderPublic {
  username: string
}

export interface GifPublic {
  id: number
  title: string
  /** Nullable in the contract; may be absent on some responses. */
  description?: string | null
  tags: string[]
  file_url: string
  view_count: number
  like_count: number
  /** Present only when authenticated (false/omitted for anonymous). */
  liked_by_me?: boolean
  uploader: UploaderPublic
  created_at: string
}

export interface GifPage {
  items: GifPublic[]
  page: number
  page_size: number
  total: number
}

export interface GifUploadInput {
  file: File
  title: string
  description?: string
  tags?: string[]
}

export interface ProfilePublic {
  user: UserPublic
  gifs: GifPage
}

export interface ReportResult {
  ok: boolean
}

/* ---------------- Errors ---------------- */

/** Contract error envelope: every error response is { detail: string }. */
export interface ApiError {
  detail: string
}

/** Parameters shared by paginated list endpoints. */
export interface PageParams {
  page?: number
  page_size?: number
}

export interface SearchParams extends PageParams {
  q: string
  tag?: string
}
