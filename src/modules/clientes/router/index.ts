import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const clientesRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes/nuevo',
    name: 'admin-clientes-nuevo',
    component: () => import('@/modules/clientes/views/ClienteFormView.vue'),
    meta: {
      title: 'Nuevo cliente',
      module: 'clientes',
      permission: PermisoBanderas.CLIENTES_CREAR,
    },
  },
  {
    path: 'clientes/:id(\\d+)/editar',
    name: 'admin-clientes-editar',
    component: () => import('@/modules/clientes/views/ClienteFormView.vue'),
    meta: {
      title: 'Editar cliente',
      module: 'clientes',
      permission: PermisoBanderas.CLIENTES_EDITAR,
    },
  },
  {
    path: 'clientes',
    name: 'admin-clientes',
    component: () => import('@/modules/clientes/views/ClientesTabsView.vue'),
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
