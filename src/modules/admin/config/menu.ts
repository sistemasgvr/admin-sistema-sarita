import { ICONS } from '@/shared/constants/icons'
import { productosMenuSubItems } from '@/modules/productos/config/productos-menu'
import { balonesMenuSubItems } from '@/modules/balones/config/balones-menu'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export interface AdminMenuSubItem {
  name: string
  path: string
  permission?: PermissionBandera
}

export interface AdminMenuItem {
  icon: string
  name: string
  path?: string
  permission?: PermissionBandera
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
        permission: PermisoBanderas.CLIENTES_LISTAR,
      },
      {
        icon: ICONS.package,
        name: 'Productos',
        subItems: productosMenuSubItems,
      },
      {
        icon: ICONS.cylinder,
        name: 'Balones',
        permission: PermisoBanderas.BALONES_HUB_VER,
        subItems: balonesMenuSubItems,
      },
    ],
  },
  {
    title: 'Configuración',
    items: [
      {
        icon: ICONS.settings,
        name: 'Configuración',
        path: '/admin/configuracion',
        permission: PermisoBanderas.CONFIGURACION_VER,
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        icon: ICONS.userCircle,
        name: 'Usuarios',
        path: '/admin/usuarios',
        permission: PermisoBanderas.USUARIOS_LISTAR,
      },
      {
        icon: ICONS.shield,
        name: 'Roles',
        path: '/admin/roles',
        permission: PermisoBanderas.ROLES_LISTAR,
      },
      {
        icon: ICONS.keyRound,
        name: 'Permisos',
        path: '/admin/permisos',
        permission: PermisoBanderas.PERMISOS_LISTAR,
      },
    ],
  },
]
