import { createRouter, createWebHistory } from 'vue-router'
import { getAccessToken } from '@/api/client'
import GifDetailPage from '@/pages/GifDetailPage.vue'
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import SearchPage from '@/pages/SearchPage.vue'
import TrendingPage from '@/pages/TrendingPage.vue'
import UploadPage from '@/pages/UploadPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/trending', name: 'trending', component: TrendingPage },
    { path: '/search', name: 'search', component: SearchPage },
    { path: '/g/:gif_id', name: 'gif-detail', component: GifDetailPage },
    {
      path: '/upload',
      name: 'upload',
      component: UploadPage,
      meta: { requiresAuth: true },
    },
    { path: '/u/:username', name: 'profile', component: ProfilePage },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/register', name: 'register', component: RegisterPage },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getAccessToken()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
