import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { PermisoBanderas } from '@/shared/constants/permissions'

/** Orden por uso: cobranzas → garantías → pagos → cierre contable. */
export const finanzasMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Cuentas por cobrar',
    path: '/admin/finanzas',
    permission: PermisoBanderas.FINANZAS_CXC_VER,
  },
  {
    name: 'Garantías',
    path: '/admin/finanzas/garantias',
    permission: PermisoBanderas.FINANZAS_GARANTIAS_VER,
  },
  {
    name: 'Cuentas por pagar',
    path: '/admin/finanzas/pagar',
    permission: PermisoBanderas.FINANZAS_CXP_VER,
  },
  {
    name: 'Libro diario',
    path: '/admin/finanzas/libro-diario',
    permission: PermisoBanderas.CAJA_LIBRO_DIARIO,
  },
]
