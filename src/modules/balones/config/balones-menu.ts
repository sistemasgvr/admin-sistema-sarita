import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { balonesMenuItems } from '@/modules/balones/config/balones-items'

export const balonesMenuSubItems: AdminMenuSubItem[] = balonesMenuItems
  .filter((item) => item.implemented)
  .map((item) => ({
    name: item.title,
    path: item.path,
    permission: item.permission,
  }))
