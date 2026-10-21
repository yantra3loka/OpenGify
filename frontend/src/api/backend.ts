import * as mockApi from './mockClient'
import * as realApi from './client'
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GifPage,
  GifPublic,
  LoginRequest,
  MessageResponse,
  ProfilePublic,
  RegisterRequest,
  ReportResult,
  SearchParams,
  Token,
  UpdateProfileRequest,
  UserPublic,
} from './types'

/**
 * Backend selector. The mock implementation mirrors client.ts exactly —
 * both are checked against BackendApi below, so flipping VITE_USE_MOCKS
 * changes nothing about the UI code, only where the data comes from.
 *
 * - VITE_USE_MOCKS=true  → contract-shaped in-memory mocks (until Keval's API is live)
 * - unset / anything else → the real FastAPI backend at VITE_API_URL
 */
export interface BackendApi {
  registerUser: (payload: RegisterRequest) => Promise<UserPublic>
  loginUser: (payload: LoginRequest) => Promise<Token>
  forgotPassword: (payload: ForgotPasswordRequest) => Promise<MessageResponse>
  fetchGifFeed: (page?: number, page_size?: number) => Promise<GifPage>
  searchGifs: (params: SearchParams) => Promise<GifPage>
  fetchTrendingGifs: (page?: number, page_size?: number) => Promise<GifPage>
  fetchGifDetail: (gif_id: number) => Promise<GifPublic>
  uploadGif: (input: {
    file: File
    title: string
    description?: string
    tags?: string[]
  }) => Promise<GifPublic>
  likeGif: (gif_id: number) => Promise<GifPublic>
  unlikeGif: (gif_id: number) => Promise<GifPublic>
  reportGif: (gif_id: number, reason?: string) => Promise<ReportResult>
  fetchUserProfile: (
    username: string,
    page?: number,
    page_size?: number,
  ) => Promise<ProfilePublic>
  fetchCurrentUser: () => Promise<UserPublic>
  getMyLiked: (page?: number, limit?: number) => Promise<GifPage>
  updateMyProfile: (payload: UpdateProfileRequest) => Promise<UserPublic>
  changeMyPassword: (payload: ChangePasswordRequest) => Promise<MessageResponse>
}

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true'

const impl: BackendApi = useMocks ? mockApi : realApi

export const backend: BackendApi = impl
export const isMockMode = useMocks
