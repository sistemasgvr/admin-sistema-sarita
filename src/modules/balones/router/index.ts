import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const balonesRoutes: RouteRecordRaw[] = [
  {
    path: 'balones',
    children: [
      {
        path: 'cilindros',
        name: 'admin-balones-cilindros',
        component: () => import('@/modules/balones/cilindros/views/CilindrosListView.vue'),
        meta: {
          title: 'Libro de cilindros',
          module: 'balones',
          permission: PermisoBanderas.BALONES_LISTAR,
        },
      },
      {
        path: 'tipos',
        name: 'admin-balones-tipos',
        component: () => import('@/modules/balones/tipos-balon/views/TiposBalonListView.vue'),
        meta: {
          title: 'Tipos de balón',
          module: 'balones',
          permission: PermisoBanderas.TIPOS_BALON_LISTAR,
        },
      },
      {
        path: '',
        redirect: { name: 'admin-balones-tipos' },
      },
    ],
  },
]
