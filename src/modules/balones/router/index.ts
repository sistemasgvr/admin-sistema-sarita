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
        path: 'movimientos',
        name: 'admin-balones-movimientos',
        component: () =>
          import('@/modules/balones/movimientos/views/MovimientosBalonListView.vue'),
        meta: {
          title: 'Movimientos',
          module: 'balones',
          permission: PermisoBanderas.MOVIMIENTOS_BALON_LISTAR,
        },
      },
      {
        path: 'recargas',
        name: 'admin-balones-recargas',
        component: () => import('@/modules/balones/recargas/views/RecargasListView.vue'),
        meta: {
          title: 'Recargas',
          module: 'balones',
          permission: PermisoBanderas.MOVIMIENTOS_RECARGA_LISTAR,
        },
      },
      {
        path: 'prestamos',
        name: 'admin-balones-prestamos',
        component: () => import('@/modules/balones/prestamos/views/PrestamosListView.vue'),
        meta: {
          title: 'Préstamos',
          module: 'balones',
          permission: PermisoBanderas.PRESTAMOS_BALON_LISTAR,
        },
      },
      {
        path: '',
        name: 'admin-balones',
        component: () => import('@/modules/balones/views/BalonesHubView.vue'),
        meta: {
          title: 'Balones',
          module: 'balones',
          permission: PermisoBanderas.BALONES_HUB_VER,
        },
      },
    ],
  },
]
