import type { RouteRecordRaw } from 'vue-router'
import { productosAccessPermissions } from '@/modules/productos/config/productos-menu'
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
          title: 'Catálogo',
          module: 'productos',
          permission: PermisoBanderas.PRODUCTOS_LISTAR,
        },
      },
      {
        path: 'articulos/nuevo',
        name: 'admin-productos-articulos-nuevo',
        component: () => import('@/modules/productos/articulos/views/ProductoFormView.vue'),
        meta: {
          title: 'Nuevo ítem de catálogo',
          module: 'productos',
          permission: PermisoBanderas.PRODUCTOS_CREAR,
        },
      },
      {
        path: 'articulos/:id/editar',
        name: 'admin-productos-articulos-editar',
        component: () => import('@/modules/productos/articulos/views/ProductoFormView.vue'),
        meta: {
          title: 'Editar ítem de catálogo',
          module: 'productos',
          permission: PermisoBanderas.PRODUCTOS_EDITAR,
        },
      },
      {
        path: 'articulos/:id(\\d+)',
        name: 'admin-productos-articulos-detalle',
        component: () => import('@/modules/productos/articulos/views/ProductoDetailView.vue'),
        meta: {
          title: 'Detalle de producto',
          module: 'productos',
          permission: PermisoBanderas.PRODUCTOS_VER,
        },
      },
      {
        path: 'stock',
        name: 'admin-productos-stock',
        component: () => import('@/modules/productos/stock/views/StockListView.vue'),
        meta: {
          title: 'Stock accesorios',
          module: 'productos',
          permission: PermisoBanderas.STOCK_LISTAR,
        },
      },
      {
        path: 'stock/:id(\\d+)',
        name: 'admin-productos-stock-detalle',
        component: () => import('@/modules/productos/stock/views/StockDetailView.vue'),
        meta: {
          title: 'Detalle de stock',
          module: 'productos',
          permission: PermisoBanderas.STOCK_VER,
        },
      },
      {
        path: 'movimientos',
        name: 'admin-productos-movimientos',
        redirect: (to) => ({
          name: 'admin-inventario-movimientos',
          query: {
            ...to.query,
            naturaleza: to.query.naturaleza ?? 'PRODUCTO',
          },
        }),
      },
      {
        path: 'movimientos/nuevo',
        name: 'admin-productos-movimientos-nuevo',
        redirect: (to) => ({
          name: 'admin-inventario-movimientos',
          query: to.query,
        }),
      },
      {
        path: 'movimientos/:id/editar',
        name: 'admin-productos-movimientos-editar',
        redirect: { name: 'admin-inventario-movimientos' },
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
          anyPermission: productosAccessPermissions,
        },
      },
    ],
  },
]
