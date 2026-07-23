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
        path: 'vsd',
        name: 'admin-ventas-vsd',
        component: () =>
          import('@/modules/ventas/comprobantes/views/VentasSinDocumentoView.vue'),
        meta: {
          title: 'Ventas Sin Documento',
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
        path: 'guias-remision',
        name: 'admin-ventas-guias-remision',
        component: () =>
          import('@/modules/ventas/guias-remision/views/GuiasRemisionListView.vue'),
        meta: {
          title: 'Guías de remisión',
          module: 'ventas',
          permission: PermisoBanderas.GUIAS_REMISION_LISTAR,
        },
      },
      {
        path: 'guias-remision/nueva',
        name: 'admin-ventas-guias-remision-nueva',
        component: () =>
          import('@/modules/ventas/guias-remision/views/GuiaRemisionFormView.vue'),
        meta: {
          title: 'Nueva guía de remisión',
          module: 'ventas',
          permission: PermisoBanderas.GUIAS_REMISION_CREAR,
        },
      },
      {
        path: 'guias-remision/:id/editar',
        name: 'admin-ventas-guias-remision-editar',
        component: () =>
          import('@/modules/ventas/guias-remision/views/GuiaRemisionFormView.vue'),
        meta: {
          title: 'Editar guía de remisión',
          module: 'ventas',
          permission: PermisoBanderas.GUIAS_REMISION_EDITAR,
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
