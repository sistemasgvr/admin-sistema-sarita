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
    name: 'Ventas sin documento',
    path: '/admin/ventas/vsd',
    permission: PermisoBanderas.COMPROBANTES_LISTAR,
  },
  {
    name: 'Notas de crédito',
    path: '/admin/ventas/notas-credito',
    permission: PermisoBanderas.COMPROBANTES_LISTAR,
  },
  {
    name: 'Guías de remisión',
    path: '/admin/ventas/guias-remision',
    permission: PermisoBanderas.GUIAS_REMISION_LISTAR,
  },
  {
    name: 'Resumen diario',
    path: '/admin/ventas/resumen-diario',
    permission: PermisoBanderas.COMPROBANTES_EMITIR,
  },
]
