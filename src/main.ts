import { createApp } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import './assets/main.css'
import App from './App.vue'
import { configureApiClient } from '@/shared/api/apiClient'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { pinia } from '@/shared/plugins/pinia'
import { queryClient, VueQueryPlugin } from '@/shared/plugins/vueQuery'
import router from './router'

const app = createApp(App)

app.use(pinia)
app.use(VueQueryPlugin, { queryClient })
app.use(router)

configureApiClient({
  getAccessToken: () => useAuthStore().token,
  onUnauthorized: () => {
    const authStore = useAuthStore()
    authStore.clearSession()
    queryClient.removeQueries()

    if (router.currentRoute.value.meta.requiresAuth) {
      router.push('/')
    }
  },
})

app.component('AppToaster', Toaster)
app.mount('#app')
