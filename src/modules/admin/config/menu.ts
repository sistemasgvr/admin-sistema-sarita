import { ICONS } from '@/shared/constants/icons'
import { productosMenuSubItems } from '@/modules/productos/config/productos-menu'
import { balonesMenuSubItems } from '@/modules/balones/config/balones-menu'
import { ventasMenuSubItems } from '@/modules/ventas/config/ventas-menu'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'
import { clientesMenuSubItems } from '@/modules/clientes/config/clientes-menu'
import { finanzasMenuSubItems } from '@/modules/finanzas/config/finanzas-menu'
import { configuracionMenuSubItems } from '@/modules/configuracion/config/configuracion-menu'
import { gestionEmpresaMenuSubItems } from '@/modules/documentos-vencimiento/config/documentos-vencimiento-menu'

export interface AdminMenuSubItem {
  name: string
  path: string
  /**
   * Rutas adicionales que deben resaltar este subítem
   * (ej. Stock activo también en /admin/productos/movimientos/*).
   */
  activeMatchPaths?: string[]
  permission?: PermissionBandera
  anyPermission?: PermissionBandera[]
  icon?: string
}

export interface AdminMenuItem {
  icon: string
  name: string
  path?: string
  permission?: PermissionBandera
  /** Ítem hoja (o hub): visible si tiene AL MENOS UNO (OR). */
  anyPermission?: PermissionBandera[]
  /** Si hay subItems, el padre se muestra con los hijos permitidos (o se aplana al hub). */
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
        icon: ICONS.creditCard,
        name: 'Ventas',
        path: '/admin/ventas/caja',
        subItems: ventasMenuSubItems,
      },
      {
        icon: ICONS.calendar,
        name: 'Actividades',
        path: '/admin/operativa/actividades',
        permission: PermisoBanderas.ACTIVIDADES_LISTAR,
      },
      {
        icon: ICONS.cylinder,
        name: 'Balones',
        path: '/admin/balones',
        permission: PermisoBanderas.BALONES_HUB_VER,
        subItems: balonesMenuSubItems,
      },
      {
        icon: ICONS.users,
        name: 'Clientes',
        subItems: clientesMenuSubItems,
        permission: PermisoBanderas.CLIENTES_LISTAR,
      },
      {
        icon: ICONS.banknote,
        name: 'Finanzas',
        path: '/admin/finanzas',
        anyPermission: finanzasMenuSubItems.flatMap((item) =>
          item.permission ? [item.permission] : (item.anyPermission ?? []),
        ),
      },
      {
        icon: ICONS.shoppingcard,
        name: 'Compras',
        path: '/admin/compras',
        permission: PermisoBanderas.COMPRAS_LISTAR,
      },
      {
        icon: ICONS.package,
        name: 'Almacenes',
        path: '/admin/productos',
        permission: PermisoBanderas.PRODUCTOS_HUB_VER,
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
        subItems: configuracionMenuSubItems,
      },
      {
        icon: ICONS.building,
        name: 'Gestión Empresa',
        subItems: gestionEmpresaMenuSubItems,
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
