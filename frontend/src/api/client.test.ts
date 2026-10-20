import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  API_BASE_URL,
  api,
  clearAccessToken,
  getAccessToken,
  getApiErrorMessage,
  resolveFileUrl,
  setAccessToken,
  setUnauthorizedHandler,
  uploadGif,
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

  it('sends upload tags as ONE comma-separated form field (Keval, Day 2)', async () => {
    const originalAdapter = api.defaults.adapter
    let seenData: unknown
    api.defaults.adapter = async (config) => {
      seenData = config.data
      return {
        data: mockGifs[0],
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      }
    }
    try {
      const file = new File(['GIF89a'], 'cat.gif', { type: 'image/gif' })
      await uploadGif({
        file,
        title: 'Cat',
        description: 'A cat',
        tags: ['cat', 'dance', 'funny'],
      })
    } finally {
      api.defaults.adapter = originalAdapter
    }
    expect(seenData).toBeInstanceOf(FormData)
    const form = seenData as FormData
    expect(form.getAll('tags')).toEqual(['cat,dance,funny'])
    expect(form.get('title')).toBe('Cat')
  })
})

describe('resolveFileUrl', () => {
  it('resolves API-relative paths against the API base URL', () => {
    expect(resolveFileUrl('/uploads/seed-dancing-cat.gif')).toBe(
      'http://localhost:8000/uploads/seed-dancing-cat.gif',
    )
  })

  it('passes absolute URLs through unchanged', () => {
    expect(resolveFileUrl('http://localhost:8000/uploads/x.gif')).toBe(
      'http://localhost:8000/uploads/x.gif',
    )
    expect(resolveFileUrl('https://cdn.example.com/x.gif')).toBe(
      'https://cdn.example.com/x.gif',
    )
  })
})

describe('401 handling (24h token, no refresh — Keval, Day 2)', () => {
  const rejectingAdapter = async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError(
      'Request failed with status code 401',
      'ERR_BAD_REQUEST',
      config,
      null,
      {
        data: { detail: 'Unauthorized' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      },
    )
  }

  it('clears the token and calls the handler on a non-auth 401', async () => {
    setAccessToken('expired-token')
    let calls = 0
    setUnauthorizedHandler(() => {
      calls += 1
    })
    await expect(
      api.get('/gifs/1', { adapter: rejectingAdapter }),
    ).rejects.toThrow()
    expect(calls).toBe(1)
    expect(getAccessToken()).toBeNull()
  })

  it('does NOT treat a failed login 401 as an expired session', async () => {
    setAccessToken('some-token')
    let calls = 0
    setUnauthorizedHandler(() => {
      calls += 1
    })
    await expect(
      api.post(
        '/auth/login',
        { email: 'a@b.c', password: 'wrong' },
        { adapter: rejectingAdapter },
      ),
    ).rejects.toThrow()
    expect(calls).toBe(0)
    expect(getAccessToken()).toBe('some-token')
    clearAccessToken()
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
