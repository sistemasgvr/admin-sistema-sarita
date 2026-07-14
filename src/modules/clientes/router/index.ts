import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const clientesRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes',
    name: 'admin-clientes',
    component: () => import('@/modules/clientes/views/ClientesListView.vue'),
    meta: {
      title: 'Clientes',
      module: 'clientes',
      permission: PermisoBanderas.CLIENTES_LISTAR,
    },
  },
  {
    path: 'clientes/mapa',
    name: 'admin-clientes-mapa',
    component: () => import('@/modules/clientes/views/ClientesMapaView.vue'),
    meta: {
      title: 'Mapa de clientes',
      module: 'clientes',
      permission: PermisoBanderas.CLIENTES_LISTAR,
    },
  },
]
