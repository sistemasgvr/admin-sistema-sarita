import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authRoutes } from '@/modules/auth/router'
import { dashboardRoutes } from '@/modules/dashboard/router'
import { clientesRoutes } from '@/modules/clientes/router'
import { usuariosRoutes } from '@/modules/usuarios/router'
import { rolesRoutes } from '@/modules/roles/router'
import { permisosRoutes } from '@/modules/permisos/router'
import { configuracionRoutes } from '@/modules/configuracion/router'
import { productosRoutes } from '@/modules/productos/router'
import { balonesRoutes } from '@/modules/balones/router'
import { ventasRoutes } from '@/modules/ventas/router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { toastWarning } from '@/shared/composables/useToast'
import { resolvePostLoginRedirect } from '@/shared/utils/resolvePostLoginRedirect'
import { contactosRoutes } from '@/modules/contactos/router'
import { direccionesRoutes } from '@/modules/direcciones/router'
import { choferesRoutes } from '@/modules/choferes/router'
import { vehiculosRoutes } from '@/modules/vehiculos/router'
import { cuentasBancariasRoutes } from '@/modules/cuentas-bancarias/router'

const adminChildren: RouteRecordRaw[] = [
  {
    path: '',
    redirect: '/admin/dashboard',
  },
  ...dashboardRoutes,
  ...clientesRoutes,
  ...usuariosRoutes,
  ...rolesRoutes,
  ...permisosRoutes,
  ...configuracionRoutes,
  ...productosRoutes,
  ...contactosRoutes,
  ...direccionesRoutes,
  ...balonesRoutes,
  ...ventasRoutes,
  ...choferesRoutes,
  ...vehiculosRoutes,
  ...cuentasBancariasRoutes,
  {
    path: ':pathMatch(.*)*',
    name: 'admin-not-found',
    component: () => import('@/modules/admin/views/NotFoundView.vue'),
    meta: {
      title: 'Página no encontrada',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    ...authRoutes,
    {
      path: '/admin',
      component: () => import('@/modules/admin/layout/AdminShell.vue'),
      meta: {
        requiresAuth: true,
      },
      children: adminChildren,
    },
  ],
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
