import type { RouteRecordRaw } from 'vue-router'

const finanzasView = () => import('@/modules/finanzas/views/FinanzasView.vue')

export const finanzasRoutes: RouteRecordRaw[] = [
  {
    path: 'finanzas',
    name: 'admin-finanzas',
    component: finanzasView,
    meta: { title: 'Finanzas', finanzasTab: 'cobrar' },
  },
  {
    path: 'finanzas/pagar',
    name: 'admin-finanzas-pagar',
    component: finanzasView,
    meta: { title: 'Cuentas por pagar', finanzasTab: 'pagar' },
  },
  {
    path: 'finanzas/garantias',
    name: 'admin-finanzas-garantias',
    component: finanzasView,
    meta: { title: 'Garantías', finanzasTab: 'garantias' },
  },
  {
    path: 'finanzas/libro-diario',
    name: 'admin-finanzas-libro-diario',
    component: finanzasView,
    meta: { title: 'Libro diario', finanzasTab: 'libro-diario' },
  },
  {
    path: 'finanzas/caja',
    redirect: { name: 'admin-ventas-caja' },
  },
]
