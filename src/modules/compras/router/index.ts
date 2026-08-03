import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const comprasRoutes: RouteRecordRaw[] = [
  {
    path: 'finanzas/compras',
    name: 'admin-finanzas-compras',
    component: () => import('@/modules/compras/views/ComprasListView.vue'),
    meta: {
      title: 'Compras',
      module: 'finanzas',
      permission: PermisoBanderas.COMPRAS_LISTAR,
    },
  },
  {
    path: 'finanzas/compras/nuevo',
    name: 'admin-finanzas-compras-nuevo',
    component: () => import('@/modules/compras/views/CompraFormView.vue'),
    meta: {
      title: 'Nueva compra',
      module: 'finanzas',
      permission: PermisoBanderas.COMPRAS_CREAR,
    },
  },
  {
    path: 'finanzas/compras/:id(\\d+)/editar',
    name: 'admin-finanzas-compras-editar',
    component: () => import('@/modules/compras/views/CompraFormView.vue'),
    meta: {
      title: 'Editar compra',
      module: 'finanzas',
      permission: PermisoBanderas.COMPRAS_EDITAR,
    },
  },
]
