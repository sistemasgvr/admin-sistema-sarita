import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

/** Orden por flujo del día: abrir caja → vender → consultar → cierre SUNAT. */
export const ventasMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Caja',
    path: '/admin/ventas/caja',
    icon: ICONS.cashRegister,
    permission: PermisoBanderas.CAJA_VER,
  },
  {
    name: 'Historial de caja',
    path: '/admin/ventas/caja/historial',
    icon: ICONS.history,
    permission: PermisoBanderas.CAJA_VER,
  },
  {
    name: 'Punto de venta',
    path: '/admin/ventas/pos',
    icon: ICONS.shoppingCart,
    permission: PermisoBanderas.COMPROBANTES_CREAR,
  },
  {
    name: 'Comprobantes',
    path: '/admin/ventas/comprobantes',
    icon: ICONS.receipt,
    permission: PermisoBanderas.COMPROBANTES_LISTAR,
  },
  {
    name: 'Ventas sin documento',
    path: '/admin/ventas/vsd',
    icon: ICONS.fileText,
    permission: PermisoBanderas.COMPROBANTES_LISTAR,
  },
  {
    name: 'Notas de crédito',
    path: '/admin/ventas/notas-credito',
    icon: ICONS.copy,
    permission: PermisoBanderas.COMPROBANTES_LISTAR,
  },
  {
    name: 'Resumen diario',
    path: '/admin/ventas/resumen-diario',
    icon: ICONS.calendarRange,
    permission: PermisoBanderas.COMPROBANTES_EMITIR,
  },
]
