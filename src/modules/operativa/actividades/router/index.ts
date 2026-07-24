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
]
