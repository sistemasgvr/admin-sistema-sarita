import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { productosMenuItems } from '@/modules/productos/config/productos-items'

export const productosMenuSubItems: AdminMenuSubItem[] = productosMenuItems.map((item) => ({
  name: item.title,
  path: item.path,
  permission: item.permission,
}))
