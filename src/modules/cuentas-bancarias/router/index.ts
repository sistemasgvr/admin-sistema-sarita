import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const cuentasBancariasRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes/cuentas-bancarias',
    name: 'admin-clientes-cuentas-bancarias',
    component: () => import('@/modules/cuentas-bancarias/views/CuentasBancariasListView.vue'),
    meta: {
      title: 'Cuentas Bancarias',
      module: 'cuentas-bancarias',
      permission: PermisoBanderas.CUENTAS_BANCARIAS_LISTAR,
    },
  },
]
