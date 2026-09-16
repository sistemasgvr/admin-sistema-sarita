import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const percepcionesRoutes: RouteRecordRaw[] = [
  {
    path: 'percepciones',
    name: 'admin-percepciones',
    component: () => import('../views/PercepcionesListView.vue'),
    meta: {
      title: 'Percepciones',
      module: 'ventas',
      permission: PermisoBanderas.PERCEPCIONES_LISTAR,
    },
  },
  {
    path: 'percepciones/nueva',
    name: 'admin-percepciones-nueva',
    component: () => import('../views/PercepcionFormView.vue'),
    meta: {
      title: 'Nueva percepción',
      module: 'ventas',
      permission: PermisoBanderas.PERCEPCIONES_CREAR,
    },
  },
  {
    path: 'percepciones/:id(\\d+)',
    name: 'admin-percepciones-detalle',
    component: () => import('../views/PercepcionDetailView.vue'),
    meta: {
      title: 'Detalle de percepción',
      module: 'ventas',
      permission: PermisoBanderas.PERCEPCIONES_VER,
    },
  },
]
