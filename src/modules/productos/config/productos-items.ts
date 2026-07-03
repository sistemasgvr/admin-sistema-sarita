import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export interface ProductosMenuItem {
  key: string
  title: string
  path: string
  permission: PermissionBandera
  phase: number
  implemented: boolean
}

export const productosMenuItems: ProductosMenuItem[] = [
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
  {
    key: 'productos',
    title: 'Productos',
    path: '/admin/productos/articulos',
    permission: PermisoBanderas.PRODUCTOS_LISTAR,
    phase: 3,
    implemented: false,
  },
  {
    key: 'stock',
    title: 'Stock',
    path: '/admin/productos/stock',
    permission: PermisoBanderas.STOCK_LISTAR,
    phase: 4,
    implemented: false,
  },
  {
    key: 'movimientos',
    title: 'Movimientos',
    path: '/admin/productos/movimientos',
    permission: PermisoBanderas.MOVIMIENTOS_LISTAR,
    phase: 4,
    implemented: false,
  },
  {
    key: 'catalogo-precios',
    title: 'Catálogo de precios',
    path: '/admin/productos/catalogo-precios',
    permission: PermisoBanderas.CATALOGO_PRECIOS_LISTAR,
    phase: 5,
    implemented: false,
  },
]
