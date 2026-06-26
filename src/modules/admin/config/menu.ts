import { ICONS } from '@/shared/constants/icons'

export interface AdminMenuSubItem {
  name: string
  path: string
}

export interface AdminMenuItem {
  icon: string
  name: string
  path?: string
  subItems?: AdminMenuSubItem[]
}

export interface AdminMenuGroup {
  title: string
  items: AdminMenuItem[]
}

export const adminMenuGroups: AdminMenuGroup[] = [
  {
    title: 'Principal',
    items: [
      {
        icon: ICONS.dashboard,
        name: 'Dashboard',
        path: '/admin/dashboard',
      },
    ],
  },
  {
    title: 'Gestión',
    items: [
      {
        icon: ICONS.users,
        name: 'Clientes',
        path: '/admin/clientes',
      },
      {
        icon: ICONS.package,
        name: 'Inventario',
        path: '/admin/inventario',
      },
      {
        icon: ICONS.clipboardList,
        name: 'Pedidos',
        path: '/admin/pedidos',
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        icon: ICONS.settings,
        name: 'Configuración',
        path: '/admin/configuracion',
      },
    ],
  },
]
