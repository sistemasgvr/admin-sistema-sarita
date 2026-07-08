import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const direccionesRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes/direcciones',
    name: 'admin-clientes-direcciones',
    component: () => import('@/modules/direcciones/views/DireccionesListView.vue'),
    meta: {
      title: 'Direcciones',
      module: 'direcciones',
      permission: PermisoBanderas.DIRECCIONES_LISTAR,
    },
  },
]
