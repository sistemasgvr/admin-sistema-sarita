import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const activosRoutes: RouteRecordRaw[] = [
  {
    path: 'activos',
    name: 'admin-activos',
    component: () => import('@/modules/activos/views/ActivosListView.vue'),
    meta: {
      title: 'Activos',
      module: 'gestion-empresa',
      permission: PermisoBanderas.ACTIVO_LISTAR,
    },
  },
]
