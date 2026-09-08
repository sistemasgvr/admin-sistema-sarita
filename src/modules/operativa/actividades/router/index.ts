import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const actividadesRoutes: RouteRecordRaw[] = [
  {
    path: 'operativa/actividades',
    name: 'admin-operativa-actividades',
    component: () => import('@/modules/operativa/actividades/views/ActividadesView.vue'),
    meta: {
      title: 'Actividades',
      module: 'operativa-actividades',
      permission: PermisoBanderas.ACTIVIDADES_LISTAR,
    },
  },
  {
    path: 'operativa/actividades/nueva',
    name: 'admin-operativa-actividades-nueva',
    component: () => import('@/modules/operativa/actividades/views/ActividadFormView.vue'),
    meta: {
      title: 'Nueva actividad',
      module: 'operativa-actividades',
      permission: PermisoBanderas.ACTIVIDADES_CREAR,
    },
  },
  {
    path: 'operativa/actividades/:id(\\d+)/editar',
    name: 'admin-operativa-actividades-editar',
    component: () => import('@/modules/operativa/actividades/views/ActividadFormView.vue'),
    meta: {
      title: 'Editar actividad',
      module: 'operativa-actividades',
      permission: PermisoBanderas.ACTIVIDADES_EDITAR,
    },
  },
]
