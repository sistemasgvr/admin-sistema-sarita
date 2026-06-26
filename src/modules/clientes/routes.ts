import type { RouteRecordRaw } from 'vue-router'

export const clientesRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes',
    name: 'admin-clientes',
    component: () => import('@/modules/admin/views/UnderDevelopmentView.vue'),
    props: { pageTitle: 'Clientes' },
    meta: { title: 'Clientes', module: 'clientes' },
  },
]
