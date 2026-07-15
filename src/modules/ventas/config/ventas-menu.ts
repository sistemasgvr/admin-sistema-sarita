import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const ventasMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Punto de venta',
    path: '/admin/ventas/pos',
    permission: PermisoBanderas.COMPROBANTES_CREAR,
  },
  {
    name: 'Comprobantes',
    path: '/admin/ventas/comprobantes',
    permission: PermisoBanderas.COMPROBANTES_LISTAR,
  },
  {
    name: 'Notas de venta',
    path: '/admin/ventas/notas-venta',
    permission: PermisoBanderas.COMPROBANTES_LISTAR,
  },
  {
    name: 'Notas de crédito',
    path: '/admin/ventas/notas-credito',
    permission: PermisoBanderas.COMPROBANTES_LISTAR,
  },
  {
    name: 'Resumen diario',
    path: '/admin/ventas/resumen-diario',
    permission: PermisoBanderas.COMPROBANTES_EMITIR,
  },
]
