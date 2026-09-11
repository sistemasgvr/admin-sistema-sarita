import type { RouteRecordRaw } from 'vue-router'

export const soporteRoutes: RouteRecordRaw[] = [
  {
    path: 'soporte',
    name: 'admin-soporte',
    component: () => import('@/modules/soporte/views/SoporteTutorialesView.vue'),
    meta: {
      title: 'Soporte y tutoriales',
      module: 'soporte',
    },
  },
]
