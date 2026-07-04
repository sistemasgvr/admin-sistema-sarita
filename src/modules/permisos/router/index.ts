import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const permisosRoutes: RouteRecordRaw[] = [
  {
    path: 'permisos',
    name: 'admin-permisos',
    component: () => import('@/modules/permisos/views/PermisosListView.vue'),
    meta: {
      title: 'Permisos',
      module: 'permisos',
      permission: PermisoBanderas.PERMISOS_LISTAR,
    },
  },
]
