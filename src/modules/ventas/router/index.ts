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
        path: 'documentos-salida',
        name: 'admin-documentos-salida',
        component: () =>
          import('@/modules/documentos-salida/views/DocumentosSalidaListView.vue'),
        meta: {
          title: 'Documentos de salida',
          module: 'ventas',
          permission: PermisoBanderas.DOCUMENTOS_SALIDA_LISTAR,
        },
      },
      {
        path: 'documentos-salida/nueva',
        name: 'admin-documentos-salida-nueva',
        component: () =>
          import('@/modules/documentos-salida/views/DocumentoSalidaFormView.vue'),
        meta: {
          title: 'Nuevo documento de salida',
          module: 'ventas',
          permission: PermisoBanderas.DOCUMENTOS_SALIDA_CREAR,
        },
      },
      {
        path: 'documentos-salida/:id(\\d+)/editar',
        name: 'admin-documentos-salida-editar',
        component: () =>
          import('@/modules/documentos-salida/views/DocumentoSalidaFormView.vue'),
        meta: {
          title: 'Documento de salida',
          module: 'ventas',
          permission: PermisoBanderas.DOCUMENTOS_SALIDA_VER,
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
        path: 'caja/historial',
        name: 'admin-ventas-caja-historial',
        component: () => import('@/modules/caja/views/HistorialCajaView.vue'),
        meta: {
          title: 'Historial de caja',
          module: 'ventas',
          permission: PermisoBanderas.CAJA_VER,
        },
      },
      {
        path: 'caja',
        name: 'admin-ventas-caja',
        component: () => import('@/modules/caja/views/CajaView.vue'),
        meta: {
          title: 'Caja',
          module: 'ventas',
          permission: PermisoBanderas.CAJA_VER,
        },
      },
      {
        path: '',
        redirect: { name: 'admin-ventas-pos' },
      },
    ],
  },
]
