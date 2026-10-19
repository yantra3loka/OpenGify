import { describe, expect, it } from 'vitest'
import {
  API_BASE_URL,
  api,
  clearAccessToken,
  getAccessToken,
  getApiErrorMessage,
  setAccessToken,
} from './client'
import { mockGifPage, mockGifs } from './mocks'

describe('API client', () => {
  it('uses the contract base URL by default', () => {
    // openapi.yaml servers[0].url
    expect(API_BASE_URL).toBe('http://localhost:8000')
  })

  it('attaches the bearer token when one is stored', async () => {
    setAccessToken('test-token-123')
    expect(getAccessToken()).toBe('test-token-123')

    let seenAuth: unknown
    await api.get('/ping', {
      adapter: async (config) => {
        seenAuth = config.headers.get('Authorization')
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }
      },
    })
    expect(seenAuth).toBe('Bearer test-token-123')

    clearAccessToken()
    expect(getAccessToken()).toBeNull()
  })

  it('extracts the contract { detail } error message', () => {
    expect(getApiErrorMessage({ response: { data: { detail: 'Bad file' } } })).toBe(
      'Bad file',
    )
    expect(getApiErrorMessage(new Error('Network Error'))).toBe('Network Error')
  })
})

describe('contract mocks', () => {
  it('mock GIFs carry every required GifPublic field', () => {
    for (const g of mockGifs) {
      expect(typeof g.id).toBe('number')
      expect(typeof g.title).toBe('string')
      expect(Array.isArray(g.tags)).toBe(true)
      expect(typeof g.file_url).toBe('string')
      expect(typeof g.view_count).toBe('number')
      expect(typeof g.like_count).toBe('number')
      expect(typeof g.uploader.username).toBe('string')
      expect(typeof g.created_at).toBe('string')
    }
  })

  it('mock page carries every required GifPage field', () => {
    const page = mockGifPage()
    expect(Array.isArray(page.items)).toBe(true)
    expect(typeof page.page).toBe('number')
    expect(typeof page.page_size).toBe('number')
    expect(typeof page.total).toBe('number')
  })
})
