import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from '@/modules/auth/routes'
import { adminRoutes } from '@/modules/admin/routes'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { toastWarning } from '@/shared/composables/useToast'
import { resolvePostLoginRedirect } from '@/shared/utils/resolvePostLoginRedirect'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [...authRoutes, ...adminRoutes],
})

router.beforeEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'Sistema Sarita'
  document.title = `${title} | Sistema Sarita`

  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isGuestRoute = to.matched.some((record) => record.meta.guest)

  if (requiresAuth && !authStore.isAuthenticated) {
    return { path: '/', query: { redirect: to.fullPath } }
  }

  if (isGuestRoute && authStore.isAuthenticated) {
    return resolvePostLoginRedirect(to.query.redirect)
  }

  const requiredPermission = [...to.matched]
    .reverse()
    .find((record) => record.meta.permission)?.meta.permission

  if (
    requiresAuth &&
    requiredPermission &&
    !authStore.hasPermission(requiredPermission)
  ) {
    toastWarning('No tienes permiso para acceder a esta sección')
    return { path: '/admin/dashboard' }
  }
})

export default router
