import { ICONS } from '@/shared/constants/icons'
import { productosMenuSubItems } from '@/modules/productos/config/productos-menu'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'
import { clientesMenuSubItems } from '@/modules/clientes/config/clientes-menu'

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
        subItems: clientesMenuSubItems,
        permission: PermisoBanderas.CLIENTES_LISTAR,
      },
      {
        icon: ICONS.package,
        name: 'Productos',
        subItems: productosMenuSubItems,
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
