import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const usuariosRoutes: RouteRecordRaw[] = [
  {
    path: 'usuarios',
    name: 'admin-usuarios',
    component: () => import('@/modules/usuarios/views/UsuariosListView.vue'),
    meta: {
      title: 'Usuarios',
      module: 'usuarios',
      permission: PermisoBanderas.USUARIOS_LISTAR,
    },
  },
]
