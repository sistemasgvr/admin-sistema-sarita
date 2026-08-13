import type { RouteRecordRaw } from 'vue-router'
import { balonesAccessPermissions } from '@/modules/balones/config/balones-menu'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const balonesRoutes: RouteRecordRaw[] = [
  {
    path: 'balones',
    children: [
      {
        path: 'cilindros/nuevo',
        name: 'admin-balones-cilindros-nuevo',
        component: () => import('@/modules/balones/cilindros/views/BalonFormView.vue'),
        meta: {
          title: 'Nuevo cilindro',
          module: 'balones',
          permission: PermisoBanderas.BALONES_CREAR,
        },
      },
      {
        path: 'cilindros/:id(\\d+)/editar',
        name: 'admin-balones-cilindros-editar',
        component: () => import('@/modules/balones/cilindros/views/BalonFormView.vue'),
        meta: {
          title: 'Editar cilindro',
          module: 'balones',
          permission: PermisoBanderas.BALONES_EDITAR,
        },
      },
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
        path: 'stock-gas',
        name: 'admin-balones-stock-gas',
        component: () => import('@/modules/balones/stock-gas/views/StockGasListView.vue'),
        meta: {
          title: 'Stock de gas',
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
        path: 'recargas/planta',
        redirect: { name: 'admin-balones-recargas', query: { tab: 'planta' } },
      },
      {
        path: 'recargas/planta/nueva',
        name: 'admin-balones-recargas-planta-nueva',
        component: () =>
          import('@/modules/balones/recargas/views/RecargaPlantaFormView.vue'),
        meta: {
          title: 'Nueva orden planta externa',
          module: 'balones',
          permission: PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR,
        },
      },
      {
        path: 'recargas/planta/:id(\\d+)/editar',
        name: 'admin-balones-recargas-planta-editar',
        component: () =>
          import('@/modules/balones/recargas/views/RecargaPlantaFormView.vue'),
        meta: {
          title: 'Editar orden planta externa',
          module: 'balones',
          permission: PermisoBanderas.MOVIMIENTOS_RECARGA_EDITAR,
        },
      },
      {
        path: 'recargas',
        name: 'admin-balones-recargas',
        component: () => import('@/modules/balones/recargas/views/RecargasTabsView.vue'),
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
        path: 'prestamos/nuevo',
        name: 'admin-balones-prestamos-nuevo',
        component: () => import('@/modules/balones/prestamos/views/PrestamoFormView.vue'),
        meta: {
          title: 'Nuevo préstamo',
          module: 'balones',
          permission: PermisoBanderas.PRESTAMOS_BALON_CREAR,
        },
      },
      {
        path: 'prestamos/:id(\\d+)/editar',
        name: 'admin-balones-prestamos-editar',
        component: () => import('@/modules/balones/prestamos/views/PrestamoFormView.vue'),
        meta: {
          title: 'Editar préstamo',
          module: 'balones',
          permission: PermisoBanderas.PRESTAMOS_BALON_EDITAR,
        },
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
        path: 'recojos',
        name: 'admin-balones-recojos',
        component: () => import('@/modules/balones/recojos/views/RecojosTabsView.vue'),
        meta: {
          title: 'Recojos',
          module: 'balones',
          permission: PermisoBanderas.RECOJOS_BALON_LISTAR,
        },
      },
      {
        path: 'alquileres/antiguedad',
        redirect: { name: 'admin-balones-alquileres', query: { tab: 'antiguedad' } },
      },
      {
        path: 'alquileres/nuevo',
        name: 'admin-balones-alquileres-nuevo',
        component: () => import('@/modules/balones/alquileres/views/AlquilerFormView.vue'),
        meta: {
          title: 'Nuevo alquiler',
          module: 'balones',
          permission: PermisoBanderas.ALQUILERES_BALON_CREAR,
        },
      },
      {
        path: 'alquileres/:id(\\d+)/editar',
        name: 'admin-balones-alquileres-editar',
        component: () => import('@/modules/balones/alquileres/views/AlquilerFormView.vue'),
        meta: {
          title: 'Editar alquiler',
          module: 'balones',
          permission: PermisoBanderas.ALQUILERES_BALON_EDITAR,
        },
      },
      {
        path: 'alquileres',
        name: 'admin-balones-alquileres',
        component: () => import('@/modules/balones/alquileres/views/AlquileresTabsView.vue'),
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
        path: 'mantenimientos/nuevo',
        name: 'admin-balones-mantenimientos-nuevo',
        component: () =>
          import('@/modules/balones/mantenimientos/views/MantenimientoFormView.vue'),
        meta: {
          title: 'Nuevo mantenimiento',
          module: 'balones',
          permission: PermisoBanderas.MANTENIMIENTOS_BALON_CREAR,
        },
      },
      {
        path: 'mantenimientos/:id(\\d+)/editar',
        name: 'admin-balones-mantenimientos-editar',
        component: () =>
          import('@/modules/balones/mantenimientos/views/MantenimientoFormView.vue'),
        meta: {
          title: 'Editar mantenimiento',
          module: 'balones',
          permission: PermisoBanderas.MANTENIMIENTOS_BALON_EDITAR,
        },
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
        path: 'rutas-pueblos',
        name: 'admin-balones-rutas-pueblos',
        component: () =>
          import('@/modules/balones/rutas-pueblos/views/RutasPueblosListView.vue'),
        meta: {
          title: 'Ruta pueblos',
          module: 'balones',
          permission: PermisoBanderas.RUTAS_PUEBLOS_LISTAR,
        },
      },
      {
        path: '',
        name: 'admin-balones',
        component: () => import('@/modules/balones/views/BalonesHubView.vue'),
        meta: {
          title: 'Balones',
          module: 'balones',
          anyPermission: balonesAccessPermissions,
        },
      },
    ],
  },
]
