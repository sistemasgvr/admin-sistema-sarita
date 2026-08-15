import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

const finanzasView = () => import('@/modules/finanzas/views/FinanzasView.vue')

export const finanzasRoutes: RouteRecordRaw[] = [
  {
    path: 'finanzas',
    name: 'admin-finanzas',
    component: finanzasView,
    meta: {
      title: 'Finanzas',
      finanzasTab: 'cobrar',
      permission: PermisoBanderas.FINANZAS_CXC_VER,
    },
  },
  {
    path: 'finanzas/pagar',
    name: 'admin-finanzas-pagar',
    component: finanzasView,
    meta: {
      title: 'Cuentas por pagar',
      finanzasTab: 'pagar',
      permission: PermisoBanderas.FINANZAS_CXP_VER,
    },
  },
  {
    path: 'finanzas/garantias',
    name: 'admin-finanzas-garantias',
    component: finanzasView,
    meta: {
      title: 'Garantías',
      finanzasTab: 'garantias',
      permission: PermisoBanderas.FINANZAS_GARANTIAS_VER,
    },
  },
  {
    path: 'finanzas/libro-diario',
    name: 'admin-finanzas-libro-diario',
    component: finanzasView,
    meta: {
      title: 'Libro diario',
      finanzasTab: 'libro-diario',
      permission: PermisoBanderas.CAJA_LIBRO_DIARIO,
    },
  },
  {
    path: 'finanzas/caja',
    redirect: { name: 'admin-ventas-caja' },
  },
]
