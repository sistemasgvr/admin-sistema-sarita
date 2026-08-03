import type { RouteRecordRaw } from 'vue-router'

export const finanzasRoutes: RouteRecordRaw[] = [
  {
    path: 'finanzas',
    name: 'admin-finanzas',
    component: () => import('@/modules/finanzas/views/FinanzasView.vue'),
    meta: {
      title: 'Finanzas',
    },
  },
]
