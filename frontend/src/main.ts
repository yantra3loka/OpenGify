import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from './App.vue'
import { setUnauthorizedHandler } from './api/client'
import { useAuth } from './api/useAuth'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(router)
app.use(VueQueryPlugin)

// Tokens expire after 24h with no refresh (Keval, Day 2): on a 401 the
// client clears the stored token and this handler drops auth state and
// sends the user back to /login.
setUnauthorizedHandler(() => {
  useAuth().logout()
  if (router.currentRoute.value.path !== '/login') {
    void router.push('/login')
  }
})

app.mount('#app')
