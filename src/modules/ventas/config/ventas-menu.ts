import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const ventasMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Punto de venta (accesorios)',
    path: '/admin/ventas/pos',
    permission: PermisoBanderas.COMPROBANTES_CREAR,
  },
  {
    name: 'Comprobantes',
    path: '/admin/ventas/comprobantes',
    permission: PermisoBanderas.COMPROBANTES_LISTAR,
  },
]
