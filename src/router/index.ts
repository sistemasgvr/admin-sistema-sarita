import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from '@/modules/auth/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [...authRoutes],
})

router.beforeEach((to, _from, next) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'Sistema Sarita'
  document.title = `${title} | Sistema Sarita`
  next()
})

export default router
