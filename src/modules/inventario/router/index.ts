import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const inventarioRoutes: RouteRecordRaw[] = [
  {
    path: 'inventario/movimientos',
    name: 'admin-inventario-movimientos',
    component: () => import('@/modules/inventario/views/InventarioMovimientosView.vue'),
    meta: {
      title: 'Movimientos de inventario',
      module: 'inventario',
      permission: PermisoBanderas.INVENTARIO_MOVIMIENTOS_LISTAR,
    },
  },
  {
    path: 'inventario/documentos-salida',
    name: 'admin-documentos-salida',
    component: () =>
      import('@/modules/documentos-salida/views/DocumentosSalidaListView.vue'),
    meta: {
      title: 'Documentos de salida',
      module: 'inventario',
      permission: PermisoBanderas.DOCUMENTOS_SALIDA_LISTAR,
    },
  },
  {
    path: 'inventario/documentos-salida/nueva',
    name: 'admin-documentos-salida-nueva',
    component: () =>
      import('@/modules/documentos-salida/views/DocumentoSalidaFormView.vue'),
    meta: {
      title: 'Nuevo documento de salida',
      module: 'inventario',
      permission: PermisoBanderas.DOCUMENTOS_SALIDA_CREAR,
    },
  },
  {
    path: 'inventario/documentos-salida/:id(\\d+)/editar',
    name: 'admin-documentos-salida-editar',
    component: () =>
      import('@/modules/documentos-salida/views/DocumentoSalidaFormView.vue'),
    meta: {
      title: 'Documento de salida',
      module: 'inventario',
      permission: PermisoBanderas.DOCUMENTOS_SALIDA_VER,
    },
  },
]
