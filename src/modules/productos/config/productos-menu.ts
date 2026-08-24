import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { productosHubItems } from '@/modules/productos/config/productos-hub-items'
import { productosMenuItems } from '@/modules/productos/config/productos-items'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export const productosAccessPermissions: PermissionBandera[] = [
  PermisoBanderas.PRODUCTOS_HUB_VER,
  ...productosHubItems.filter((item) => item.implemented).map((item) => item.permission),
]

export const productosMenuSubItems: AdminMenuSubItem[] = [
  ...productosMenuItems.map((item) => ({
    name: item.title,
    path: item.path,
    activeMatchPaths: item.activeMatchPaths,
    permission: item.permission,
  })),
]
