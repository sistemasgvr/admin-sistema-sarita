import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const clientesRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes',
    name: 'admin-clientes',
    component: () => import('@/modules/admin/views/UnderDevelopmentView.vue'),
    props: { pageTitle: 'Clientes' },
    meta: {
      title: 'Clientes',
      module: 'clientes',
      permission: PermisoBanderas.CLIENTES_LISTAR,
    },
  },
]
