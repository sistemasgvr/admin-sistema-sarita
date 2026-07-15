import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const ventasRoutes: RouteRecordRaw[] = [
  {
    path: 'ventas',
    children: [
      {
        path: 'pos',
        name: 'admin-ventas-pos',
        component: () => import('@/modules/ventas/comprobantes/views/PosView.vue'),
        meta: {
          title: 'Punto de venta',
          module: 'ventas',
          permission: PermisoBanderas.COMPROBANTES_CREAR,
        },
      },
      {
        path: 'comprobantes',
        name: 'admin-ventas-comprobantes',
        component: () =>
          import('@/modules/ventas/comprobantes/views/ComprobantesListView.vue'),
        meta: {
          title: 'Comprobantes',
          module: 'ventas',
          permission: PermisoBanderas.COMPROBANTES_LISTAR,
        },
      },
      {
        path: 'notas-venta',
        name: 'admin-ventas-notas-venta',
        component: () =>
          import('@/modules/ventas/comprobantes/views/NotasVentaListView.vue'),
        meta: {
          title: 'Notas de venta',
          module: 'ventas',
          permission: PermisoBanderas.COMPROBANTES_LISTAR,
        },
      },
      {
        path: 'notas-credito',
        name: 'admin-ventas-notas-credito',
        component: () =>
          import('@/modules/ventas/comprobantes/views/NotasCreditoListView.vue'),
        meta: {
          title: 'Notas de crédito',
          module: 'ventas',
          permission: PermisoBanderas.COMPROBANTES_LISTAR,
        },
      },
      {
        path: 'resumen-diario',
        name: 'admin-ventas-resumen-diario',
        component: () =>
          import('@/modules/ventas/comprobantes/views/ResumenDiarioView.vue'),
        meta: {
          title: 'Resumen diario',
          module: 'ventas',
          permission: PermisoBanderas.COMPROBANTES_EMITIR,
        },
      },
      {
        path: '',
        redirect: { name: 'admin-ventas-pos' },
      },
    ],
  },
]
