import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const retencionesRoutes: RouteRecordRaw[] = [
  {
    path: 'retenciones',
    name: 'admin-retenciones',
    component: () => import('../views/RetencionesListView.vue'),
    meta: {
      title: 'Retenciones',
      module: 'compras',
      permission: PermisoBanderas.RETENCIONES_LISTAR,
    },
  },
  {
    path: 'retenciones/nueva',
    name: 'admin-retenciones-nueva',
    component: () => import('../views/RetencionFormView.vue'),
    meta: {
      title: 'Nueva retención',
      module: 'compras',
      permission: PermisoBanderas.RETENCIONES_CREAR,
    },
  },
  {
    path: 'retenciones/:id(\\d+)',
    name: 'admin-retenciones-detalle',
    component: () => import('../views/RetencionDetailView.vue'),
    meta: {
      title: 'Detalle de retención',
      module: 'compras',
      permission: PermisoBanderas.RETENCIONES_VER,
    },
  },
]
