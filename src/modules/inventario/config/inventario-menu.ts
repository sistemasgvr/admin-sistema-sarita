import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const inventarioMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Movimientos',
    path: '/admin/inventario/movimientos',
    icon: ICONS.arrowLeftRight,
    permission: PermisoBanderas.INVENTARIO_MOVIMIENTOS_LISTAR,
  },
]
