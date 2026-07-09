import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const vehiculosRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes/vehiculos',
    name: 'admin-clientes-vehiculos',
    component: () => import('@/modules/vehiculos/views/VehiculosListView.vue'),
    meta: {
      title: 'Vehículos',
      module: 'vehiculos',
      permission: PermisoBanderas.VEHICULOS_LISTAR,
    },
  },
]
