import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const comprasRoutes: RouteRecordRaw[] = [
  {
    path: 'compras',
    name: 'admin-compras',
    component: () => import('@/modules/compras/views/ComprasListView.vue'),
    meta: {
      title: 'Compras',
      module: 'compras',
      permission: PermisoBanderas.COMPRAS_LISTAR,
    },
  },
  {
    path: 'compras/nuevo',
    name: 'admin-compras-nuevo',
    component: () => import('@/modules/compras/views/CompraFormView.vue'),
    meta: {
      title: 'Nueva compra',
      module: 'compras',
      permission: PermisoBanderas.COMPRAS_CREAR,
    },
  },
  {
    path: 'compras/:id(\\d+)/editar',
    name: 'admin-compras-editar',
    component: () => import('@/modules/compras/views/CompraFormView.vue'),
    meta: {
      title: 'Editar compra',
      module: 'compras',
      permission: PermisoBanderas.COMPRAS_EDITAR,
    },
  },
]
