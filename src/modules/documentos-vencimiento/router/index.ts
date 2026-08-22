import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const documentosVencimientoRoutes: RouteRecordRaw[] = [
  {
    path: 'documentos-vencimiento',
    name: 'admin-documentos-vencimiento',
    component: () =>
      import('@/modules/documentos-vencimiento/views/DocumentosVencimientoView.vue'),
    meta: {
      title: 'Permisos y certificados',
      module: 'documentos-vencimiento',
      permission: PermisoBanderas.DOCUMENTOS_VENCIMIENTO_LISTAR,
    },
  },
]
