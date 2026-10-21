import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
} from 'vue-router'
import type { Component } from 'vue'

const stub = { template: '<div />' }

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: stub },
  { path: '/trending', name: 'trending', component: stub },
  { path: '/search', name: 'search', component: stub },
  { path: '/g/:gif_id', name: 'gif-detail', component: stub },
  { path: '/u/:username', name: 'profile', component: stub },
  { path: '/upload', name: 'upload', component: stub },
  { path: '/login', name: 'login', component: stub },
  { path: '/forgot-password', name: 'forgot-password', component: stub },
  { path: '/register', name: 'register', component: stub },
]

export function createTestRouter() {
  return createRouter({ history: createMemoryHistory(), routes })
}

/** Mount a component with the app's real plugins (router + TanStack Query). */
export async function mountWithPlugins(
  component: Component,
  options: { route?: string; props?: Record<string, unknown> } = {},
) {
  const router = createTestRouter()
  await router.push(options.route ?? '/')
  await router.isReady()
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = mount(component, {
    props: options.props,
    global: {
      plugins: [[VueQueryPlugin, { queryClient }], router],
    },
  })
  return { wrapper, router, queryClient }
}

/** Let pending promises / Vue reactivity flush. */
export const flush = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms))

/** Axios-shaped error carrying the contract's { detail } envelope. */
export function apiError(detail: string, status = 400) {
  return {
    isAxiosError: true,
    message: detail,
    response: { status, data: { detail } },
  }
}
