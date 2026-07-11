import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const choferesRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes/choferes',
    name: 'admin-clientes-choferes',
    component: () => import('@/modules/choferes/views/ChoferesListView.vue'),
    meta: {
      title: 'Choferes',
      module: 'choferes',
      permission: PermisoBanderas.CHOFERES_LISTAR,
    },
  },
]
