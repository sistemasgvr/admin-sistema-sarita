import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export interface ProductosMenuItem {
  key: string
  title: string
  path: string
  /** Prefijos de ruta que también resaltan este ítem en el sidebar. */
  activeMatchPaths?: string[]
  permission: PermissionBandera
  phase: number
  implemented: boolean
}

/** Orden por uso: catálogo/stock primero; categorías al final (maestros). */
export const productosMenuItems: ProductosMenuItem[] = [
  {
    key: 'productos',
    title: 'Catálogo',
    path: '/admin/productos/articulos',
    permission: PermisoBanderas.PRODUCTOS_LISTAR,
    phase: 3,
    implemented: true,
  },
  {
    key: 'stock',
    title: 'Stock',
    path: '/admin/productos/stock',
    // Ajuste / traslado viven bajo movimientos pero se operan desde Stock.
    activeMatchPaths: ['/admin/productos/movimientos'],
    permission: PermisoBanderas.STOCK_LISTAR,
    phase: 4,
    implemented: true,
  },
  {
    key: 'categorias',
    title: 'Categorías',
    path: '/admin/productos/categorias',
    permission: PermisoBanderas.CATEGORIAS_LISTAR,
    phase: 2,
    implemented: true,
  },
  {
    key: 'sub-categorias',
    title: 'Subcategorías',
    path: '/admin/productos/sub-categorias',
    permission: PermisoBanderas.SUB_CATEGORIAS_LISTAR,
    phase: 2,
    implemented: true,
  },
]
