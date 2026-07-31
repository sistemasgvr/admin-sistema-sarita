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
        path: 'articulos/nuevo',
        name: 'admin-productos-articulos-nuevo',
        component: () => import('@/modules/productos/articulos/views/ProductoFormView.vue'),
        meta: {
          title: 'Nuevo producto',
          module: 'productos',
          permission: PermisoBanderas.PRODUCTOS_CREAR,
        },
      },
      {
        path: 'articulos/:id/editar',
        name: 'admin-productos-articulos-editar',
        component: () => import('@/modules/productos/articulos/views/ProductoFormView.vue'),
        meta: {
          title: 'Editar producto',
          module: 'productos',
          permission: PermisoBanderas.PRODUCTOS_EDITAR,
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
        component: () =>
          import('@/modules/productos/movimientos/views/MovimientosListView.vue'),
        meta: {
          title: 'Movimientos',
          module: 'productos',
          permission: PermisoBanderas.MOVIMIENTOS_LISTAR,
        },
      },
      {
        path: 'movimientos/nuevo',
        name: 'admin-productos-movimientos-nuevo',
        component: () =>
          import('@/modules/productos/movimientos/views/MovimientoInventarioFormView.vue'),
        meta: {
          title: 'Nuevo movimiento',
          module: 'productos',
          permission: PermisoBanderas.MOVIMIENTOS_CREAR,
        },
      },
      {
        path: 'movimientos/:id/editar',
        name: 'admin-productos-movimientos-editar',
        component: () =>
          import('@/modules/productos/movimientos/views/MovimientoInventarioFormView.vue'),
        meta: {
          title: 'Editar movimiento',
          module: 'productos',
          permission: PermisoBanderas.MOVIMIENTOS_EDITAR,
        },
      },
      {
        path: 'catalogo-precios',
        name: 'admin-productos-catalogo-precios',
        component: () =>
          import('@/modules/productos/catalogo-precios/views/CatalogoPreciosListView.vue'),
        meta: {
          title: 'Catálogo de precios',
          module: 'productos',
          permission: PermisoBanderas.CATALOGO_PRECIOS_LISTAR,
        },
      },
      {
        path: '',
        name: 'admin-productos',
        component: () => import('@/modules/productos/views/ProductosHubView.vue'),
        meta: {
          title: 'Productos',
          module: 'productos',
          permission: PermisoBanderas.PRODUCTOS_HUB_VER,
        },
      },
    ],
  },
]
