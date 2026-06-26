import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'auth-login',
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: {
      title: 'Iniciar sesión',
      guest: true,
    },
  },
  {
    path: '/login',
    redirect: '/',
  },
]
