import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const balonesRoutes: RouteRecordRaw[] = [
  {
    path: 'balones',
    children: [
      {
        path: 'cilindros/:id(\\d+)',
        name: 'admin-balones-cilindros-detalle',
        component: () => import('@/modules/balones/cilindros/views/CilindroDetailView.vue'),
        meta: {
          title: 'Ficha del cilindro',
          module: 'balones',
          permission: PermisoBanderas.BALONES_VER,
        },
      },
      {
        path: 'cilindros',
        name: 'admin-balones-cilindros',
        component: () => import('@/modules/balones/cilindros/views/CilindrosTabsView.vue'),
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
        path: 'recargas/nueva',
        name: 'admin-balones-recarga-cliente',
        component: () => import('@/modules/balones/recargas/views/RecargaClienteView.vue'),
        meta: {
          title: 'Recargar balón',
          module: 'balones',
          permission: PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR,
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
        path: 'prestamos/antiguedad',
        redirect: { name: 'admin-balones-prestamos', query: { tab: 'antiguedad' } },
      },
      {
        path: 'prestamos',
        name: 'admin-balones-prestamos',
        component: () => import('@/modules/balones/prestamos/views/PrestamosTabsView.vue'),
        meta: {
          title: 'Préstamos',
          module: 'balones',
          permission: PermisoBanderas.PRESTAMOS_BALON_LISTAR,
        },
      },
      {
        path: 'alquileres',
        name: 'admin-balones-alquileres',
        component: () => import('@/modules/balones/alquileres/views/AlquileresListView.vue'),
        meta: {
          title: 'Alquileres',
          module: 'balones',
          permission: PermisoBanderas.ALQUILERES_BALON_LISTAR,
        },
      },
      {
        path: 'bajas-pendientes',
        redirect: { name: 'admin-balones-cilindros', query: { tab: 'aprobaciones' } },
      },
      {
        path: 'mantenimientos',
        name: 'admin-balones-mantenimientos',
        component: () =>
          import('@/modules/balones/mantenimientos/views/MantenimientosListView.vue'),
        meta: {
          title: 'Mantenimientos',
          module: 'balones',
          permission: PermisoBanderas.MANTENIMIENTOS_BALON_LISTAR,
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
