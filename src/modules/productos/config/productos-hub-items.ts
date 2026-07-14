import { ICONS, type IconName } from '@/shared/constants/icons'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export interface ProductosHubItem {
  key: string
  title: string
  description: string
  path: string
  icon: IconName
  permission: PermissionBandera
  implemented: boolean
}

export const productosHubItems: ProductosHubItem[] = [
  {
    key: 'categorias',
    title: 'Categorías',
    description: 'Organiza el catálogo por categorías de producto.',
    path: '/admin/productos/categorias',
    icon: ICONS.layers,
    permission: PermisoBanderas.CATEGORIAS_LISTAR,
    implemented: true,
  },
  {
    key: 'sub-categorias',
    title: 'Subcategorías',
    description: 'Subdivide categorías para una clasificación más fina.',
    path: '/admin/productos/sub-categorias',
    icon: ICONS.listTree,
    permission: PermisoBanderas.SUB_CATEGORIAS_LISTAR,
    implemented: true,
  },
  {
    key: 'productos',
    title: 'Productos',
    description: 'Artículos, gases y servicios del inventario comercial.',
    path: '/admin/productos/articulos',
    icon: ICONS.package,
    permission: PermisoBanderas.PRODUCTOS_LISTAR,
    implemented: true,
  },
  {
    key: 'stock',
    title: 'Stock',
    description: 'Existencias por almacén y producto.',
    path: '/admin/productos/stock',
    icon: ICONS.boxes,
    permission: PermisoBanderas.STOCK_LISTAR,
    implemented: true,
  },
  {
    key: 'movimientos',
    title: 'Movimientos',
    description: 'Ingresos, salidas y ajustes de inventario.',
    path: '/admin/productos/movimientos',
    icon: ICONS.arrowLeftRight,
    permission: PermisoBanderas.MOVIMIENTOS_LISTAR,
    implemented: true,
  },
  {
    key: 'catalogo-precios',
    title: 'Catálogo de precios',
    description: 'Listas de precios por cliente o canal de venta.',
    path: '/admin/productos/catalogo-precios',
    icon: ICONS.tags,
    permission: PermisoBanderas.CATALOGO_PRECIOS_LISTAR,
    implemented: true,
  },
]
