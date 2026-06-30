import { createApp } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import './assets/main.css'
import App from './App.vue'
import { configureApiClient } from '@/shared/api/apiClient'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { pinia } from '@/shared/plugins/pinia'
import { queryClient, VueQueryPlugin } from '@/shared/plugins/vueQuery'
import { toastWarning } from '@/shared/composables/useToast'
import router from './router'

const app = createApp(App)

app.use(pinia)
app.use(VueQueryPlugin, { queryClient })
app.use(router)

let isHandlingUnauthorized = false

configureApiClient({
  getAccessToken: () => useAuthStore().token,
  onUnauthorized: ({ sessionExpired }) => {
    if (isHandlingUnauthorized) return
    isHandlingUnauthorized = true

    const authStore = useAuthStore()
    const currentRoute = router.currentRoute.value
    const wasAuthenticated = authStore.isAuthenticated
    const redirectPath = currentRoute.meta.requiresAuth ? currentRoute.fullPath : undefined

    if (sessionExpired && wasAuthenticated) {
      toastWarning('Tu sesión expiró. Inicia sesión nuevamente.')
    }

    authStore.clearSession()
    queryClient.removeQueries()

    if (currentRoute.meta.requiresAuth) {
      router.push({
        path: '/',
        query: redirectPath ? { redirect: redirectPath } : undefined,
      })
    }

    window.setTimeout(() => {
      isHandlingUnauthorized = false
    }, 300)
  },
})

app.component('AppToaster', Toaster)
app.mount('#app')
