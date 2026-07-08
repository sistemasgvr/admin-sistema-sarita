import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const contactosRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes/contactos',
    name: 'admin-clientes-contactos',
    component: () => import('@/modules/contactos/views/ContactosListView.vue'),
    meta: {
      title: 'Contactos',
      module: 'contactos',
      permission: PermisoBanderas.CONTACTOS_LISTAR,
    },
  },
]
