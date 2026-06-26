import type { RouteRecordRaw } from 'vue-router'
import { dashboardRoutes } from '@/modules/dashboard/routes'

/** Rutas del menú que aún no tienen módulo propio → página en desarrollo */
const developmentPages = [
  { path: 'clientes', title: 'Clientes' },
  { path: 'inventario', title: 'Inventario' },
  { path: 'pedidos', title: 'Pedidos' },
  { path: 'configuracion', title: 'Configuración' },
] as const

const developmentRoutes: RouteRecordRaw[] = developmentPages.map(({ path, title }) => ({
  path,
  name: `admin-${path}`,
  component: () => import('@/modules/admin/views/UnderDevelopmentView.vue'),
  props: { pageTitle: title },
  meta: { title, status: 'development' },
}))

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: () => import('@/modules/admin/layout/AdminShell.vue'),
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      ...dashboardRoutes,
      ...developmentRoutes,
      {
        path: ':pathMatch(.*)*',
        name: 'admin-not-found',
        component: () => import('@/modules/admin/views/NotFoundView.vue'),
        meta: {
          title: 'Página no encontrada',
        },
      },
    ],
  },
]
