import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const rolesRoutes: RouteRecordRaw[] = [
  {
    path: 'roles',
    name: 'admin-roles',
    component: () => import('@/modules/roles/views/RolesListView.vue'),
    meta: {
      title: 'Roles',
      module: 'roles',
      permission: PermisoBanderas.ROLES_LISTAR,
    },
  },
]
