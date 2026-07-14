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
          title: 'Mostrador',
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
