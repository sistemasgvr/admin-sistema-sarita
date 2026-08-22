import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const trabajadoresRoutes: RouteRecordRaw[] = [
  {
    path: 'trabajadores',
    name: 'admin-trabajadores',
    component: () => import('@/modules/trabajadores/views/TrabajadoresListView.vue'),
    meta: {
      title: 'Trabajadores',
      module: 'configuracion',
      permission: PermisoBanderas.TRABAJADOR_LISTAR,
    },
  },
]
