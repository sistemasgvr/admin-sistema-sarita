import type { RouteRecordRaw } from 'vue-router'
import { dashboardRoutes } from '@/modules/dashboard/routes'
import { clientesRoutes } from '@/modules/clientes/routes'
import { usuariosRoutes } from '@/modules/usuarios/routes'

const moduleRoutes: RouteRecordRaw[] = [
  ...dashboardRoutes,
  ...clientesRoutes,
  ...usuariosRoutes,
]

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: () => import('@/modules/admin/layout/AdminShell.vue'),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      ...moduleRoutes,
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
