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
]
