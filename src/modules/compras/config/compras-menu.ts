import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

/**
 * Subítems del padre "Gastos y Compras": compras/gastos documentados (con
 * proveedor y comprobante) y gastos de caja (registrados desde el flujo de
 * apertura/cierre de caja). Son 2 flujos de registro distintos, con permisos
 * distintos, agrupados bajo un mismo menú por su naturaleza (clasificación
 * de gasto operativo).
 */
export const comprasMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Compras',
    path: '/admin/compras',
    icon: ICONS.shoppingcard,
    permission: PermisoBanderas.COMPRAS_LISTAR,
  },
  {
    name: 'Gastos de caja',
    path: '/admin/compras/gastos-caja',
    icon: ICONS.wallet,
    permission: PermisoBanderas.CAJA_VER,
  },
]
