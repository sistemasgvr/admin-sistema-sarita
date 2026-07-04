import type { RouteRecordRaw } from 'vue-router'

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'admin-dashboard',
    component: () => import('@/modules/dashboard/views/DashboardView.vue'),
    meta: {
      title: 'Dashboard',
    },
  },
]
