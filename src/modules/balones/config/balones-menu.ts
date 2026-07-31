import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { balonesMenuItems } from '@/modules/balones/config/balones-items'
import { ICONS } from '@/shared/constants/icons'

const iconosBalones: Record<string, string> = {
  tipos: ICONS.cylinder,
  cilindros: ICONS.boxes,
  movimientos: ICONS.arrowLeftRight,
  recargas: ICONS.refreshCw,
  prestamos: ICONS.clipboardList,
  alquileres: ICONS.receipt,
  mantenimientos: ICONS.construction,
}

export const balonesMenuSubItems: AdminMenuSubItem[] = balonesMenuItems
  .filter((item) => item.implemented)
  .map((item) => ({
    name: item.title,
    path: item.path,
    permission: item.permission,
    icon: iconosBalones[item.key] ?? ICONS.cylinder,
  }))
