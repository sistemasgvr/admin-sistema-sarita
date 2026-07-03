import type { RouteRecordRaw } from 'vue-router'
import { dashboardRoutes } from '@/modules/dashboard/routes'
import { clientesRoutes } from '@/modules/clientes/routes'
import { usuariosRoutes } from '@/modules/usuarios/routes'
import { rolesRoutes } from '@/modules/roles/routes'
import { permisosRoutes } from '@/modules/permisos/routes'
import { configuracionRoutes } from '@/modules/configuracion/routes'
import { productosRoutes } from '@/modules/productos/routes'

const moduleRoutes: RouteRecordRaw[] = [
  ...dashboardRoutes,
  ...clientesRoutes,
  ...usuariosRoutes,
  ...rolesRoutes,
  ...permisosRoutes,
  ...configuracionRoutes,
  ...productosRoutes,
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
