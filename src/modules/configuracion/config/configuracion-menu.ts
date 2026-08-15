import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import {
  configuracionHubItems,
  type ConfiguracionHubItem,
} from '@/modules/configuracion/config/configuracion-items'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

const visibleHubItems = (): ConfiguracionHubItem[] =>
  configuracionHubItems.filter((item) => !item.hidden)

export const configuracionAccessPermissions: PermissionBandera[] = [
  PermisoBanderas.CONFIGURACION_VER,
  ...visibleHubItems().map((item) => item.permission),
]

export const configuracionMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'General',
    path: '/admin/configuracion',
    permission: PermisoBanderas.CONFIGURACION_VER,
  },
  ...visibleHubItems().map((item) => ({
    name: item.title,
    path: item.path,
    permission: item.permission,
  })),
]
