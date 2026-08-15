import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { balonesHubItems } from '@/modules/balones/config/balones-hub-items'
import { balonesMenuItems } from '@/modules/balones/config/balones-items'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export const balonesAccessPermissions: PermissionBandera[] = [
  PermisoBanderas.BALONES_HUB_VER,
  ...balonesHubItems.filter((item) => item.implemented).map((item) => item.permission),
]

export const balonesMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'General',
    path: '/admin/balones',
    permission: PermisoBanderas.BALONES_HUB_VER,
  },
  ...balonesMenuItems
    .filter((item) => item.implemented)
    .map((item) => ({
      name: item.title,
      path: item.path,
      permission: item.permission,
    })),
]
