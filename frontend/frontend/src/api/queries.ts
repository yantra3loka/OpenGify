import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { backend } from './backend'
import type { GifPage, GifPublic, ProfilePublic, SearchParams } from './types'

export const PAGE_SIZE = 20

/* ---------------- Query keys ---------------- */

export const gifKeys = {
  all: ['gifs'] as const,
  feed: () => [...gifKeys.all, 'feed'] as const,
  trending: () => [...gifKeys.all, 'trending'] as const,
  search: (q: string, tag?: string) => [...gifKeys.all, 'search', q, tag ?? ''] as const,
  detail: (id: number) => [...gifKeys.all, 'detail', id] as const,
  profile: (username: string, page: number) =>
    [...gifKeys.all, 'profile', username, page] as const,
}

function nextPageParam(last: GifPage): number | undefined {
  return last.page * last.page_size < last.total ? last.page + 1 : undefined
}

/* ---------------- Infinite lists ---------------- */

export function useGifFeed() {
  return useInfiniteQuery({
    queryKey: gifKeys.feed(),
    queryFn: ({ pageParam }) => backend.fetchGifFeed(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  })
}

export function useTrendingGifs() {
  return useInfiniteQuery({
    queryKey: gifKeys.trending(),
    queryFn: ({ pageParam }) => backend.fetchTrendingGifs(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  })
}

export function useGifSearch(
  q: MaybeRefOrGetter<string>,
  tag?: MaybeRefOrGetter<string | undefined>,
) {
  return useInfiniteQuery({
    queryKey: computed(() => gifKeys.search(toValue(q), toValue(tag))),
    queryFn: ({ pageParam }) => {
      const params: SearchParams = {
        q: toValue(q),
        tag: toValue(tag),
        page: pageParam,
        page_size: PAGE_SIZE,
      }
      return backend.searchGifs(params)
    },
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled: computed(
      () => toValue(q).trim().length > 0 || (toValue(tag)?.trim().length ?? 0) > 0,
    ),
  })
}

/* ---------------- Detail & profile ---------------- */

export function useGifDetail(id: number) {
  return useQuery({
    queryKey: gifKeys.detail(id),
    queryFn: () => backend.fetchGifDetail(id),
  })
}

export function useUserProfile(
  username: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number> = 1,
) {
  return useQuery({
    queryKey: computed(() => gifKeys.profile(toValue(username), toValue(page))),
    queryFn: () =>
      backend.fetchUserProfile(toValue(username), toValue(page), PAGE_SIZE),
  })
}

/* ---------------- Mutations ---------------- */

/** Apply a like/unlike flip to any cached shape that contains the GIF. */
function flipLikeInData(data: unknown, gifId: number, liked: boolean): unknown {
  if (!data || typeof data !== 'object') return data
  const flip = (g: GifPublic): GifPublic =>
    g.id === gifId
      ? {
          ...g,
          liked_by_me: liked,
          like_count: g.like_count + (liked ? 1 : -1),
        }
      : g

  if ('items' in data && Array.isArray((data as GifPage).items)) {
    const page = data as GifPage
    return { ...page, items: page.items.map(flip) }
  }
  if ('pages' in data && Array.isArray((data as { pages: GifPage[] }).pages)) {
    const inf = data as { pages: GifPage[] }
    return {
      ...inf,
      pages: inf.pages.map((p) => ({ ...p, items: p.items.map(flip) })),
    }
  }
  if ('user' in data && 'gifs' in data) {
    const profile = data as ProfilePublic
    return {
      ...profile,
      gifs: { ...profile.gifs, items: profile.gifs.items.map(flip) },
    }
  }
  if ('id' in data && typeof (data as GifPublic).id === 'number') {
    return flip(data as GifPublic)
  }
  return data
}

export function useToggleLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, liked }: { id: number; liked: boolean }) =>
      liked ? backend.unlikeGif(id) : backend.likeGif(id),
    onMutate: async ({ id, liked }) => {
      await queryClient.cancelQueries({ queryKey: gifKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: gifKeys.all })
      queryClient.setQueriesData({ queryKey: gifKeys.all }, (old: unknown) =>
        flipLikeInData(old, id, !liked),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: gifKeys.all })
    },
  })
}

export function useUploadGif() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: backend.uploadGif,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gifKeys.all })
    },
  })
}

export function useReportGif() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      backend.reportGif(id, reason),
  })
}
