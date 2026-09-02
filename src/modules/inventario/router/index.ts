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
]
