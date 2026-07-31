import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { productosMenuItems } from '@/modules/productos/config/productos-items'
import { ICONS } from '@/shared/constants/icons'

const iconosProductos: Record<string, string> = {
  categorias: ICONS.tags,
  'sub-categorias': ICONS.listTree,
  productos: ICONS.package,
  stock: ICONS.boxes,
  movimientos: ICONS.arrowLeftRight,
}

export const productosMenuSubItems: AdminMenuSubItem[] = productosMenuItems.map((item) => ({
  name: item.title,
  path: item.path,
  permission: item.permission,
  icon: iconosProductos[item.key] ?? ICONS.package,
}))
