import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const productosRoutes: RouteRecordRaw[] = [
  {
    path: 'productos',
    children: [
      {
        path: 'categorias',
        name: 'admin-productos-categorias',
        component: () =>
          import('@/modules/productos/categorias/views/CategoriasProductoListView.vue'),
        meta: {
          title: 'Categorías',
          module: 'productos',
          permission: PermisoBanderas.CATEGORIAS_LISTAR,
        },
      },
      {
        path: 'sub-categorias',
        name: 'admin-productos-sub-categorias',
        component: () =>
          import('@/modules/productos/sub-categorias/views/SubCategoriasProductoListView.vue'),
        meta: {
          title: 'Subcategorías',
          module: 'productos',
          permission: PermisoBanderas.SUB_CATEGORIAS_LISTAR,
        },
      },
      {
        path: 'articulos',
        name: 'admin-productos-articulos',
        component: () => import('@/modules/productos/articulos/views/ProductosListView.vue'),
        meta: {
          title: 'Productos',
          module: 'productos',
          permission: PermisoBanderas.PRODUCTOS_LISTAR,
        },
      },
      {
        path: 'stock',
        name: 'admin-productos-stock',
        component: () => import('@/modules/productos/stock/views/StockListView.vue'),
        meta: {
          title: 'Stock',
          module: 'productos',
          permission: PermisoBanderas.STOCK_LISTAR,
        },
      },
      {
        path: 'movimientos',
        name: 'admin-productos-movimientos',
        component: () => import('@/modules/productos/views/ProductosSectionPlaceholder.vue'),
        props: { pageTitle: 'Movimientos', phase: 4 },
        meta: {
          title: 'Movimientos',
          module: 'productos',
          permission: PermisoBanderas.MOVIMIENTOS_LISTAR,
        },
      },
      {
        path: 'catalogo-precios',
        name: 'admin-productos-catalogo-precios',
        component: () => import('@/modules/productos/views/ProductosSectionPlaceholder.vue'),
        props: { pageTitle: 'Catálogo de precios', phase: 5 },
        meta: {
          title: 'Catálogo de precios',
          module: 'productos',
          permission: PermisoBanderas.CATALOGO_PRECIOS_LISTAR,
        },
      },
      {
        path: '',
        redirect: { name: 'admin-productos-categorias' },
      },
    ],
  },
]
