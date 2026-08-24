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
    title: 'Catálogo',
    description:
      'Accesorios, gases (precio de venta) y servicios. El stock de gas está en Balones / Stock de gas.',
    path: '/admin/productos/articulos',
    icon: ICONS.package,
    permission: PermisoBanderas.PRODUCTOS_LISTAR,
    implemented: true,
  },
  {
    key: 'stock',
    title: 'Stock',
    description:
      'Saldo actual por almacén (inicia en 0 al crear el producto). Ajustes y traslados desde aquí; ingresos por Compras y salidas por Ventas.',
    path: '/admin/productos/stock',
    icon: ICONS.boxes,
    permission: PermisoBanderas.STOCK_LISTAR,
    implemented: true,
  },
]
