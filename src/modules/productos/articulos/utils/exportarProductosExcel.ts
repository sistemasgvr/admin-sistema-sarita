import { productosService } from '@/modules/productos/articulos/services/productos.service'
import type {
  Producto,
  ProductoListFilters,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import { toastInfo } from '@/shared/composables/useToast'
import { downloadExcelWorkbook, fetchAllPages } from '@/shared/utils/exportExcel'

function tipoItem(producto: Producto) {
  if (producto.es_servicio) return 'Servicio'
  if (producto.es_gas) return 'Gas'
  return 'Accesorio'
}

export async function exportarProductosExcel(filters: ProductoListFilters): Promise<void> {
  const rows = await fetchAllPages(productosService.listar, {
    ...filters,
    incluirImagenes: false,
  })

  if (!rows.length) {
    toastInfo('No hay productos que coincidan con los filtros actuales')
    return
  }

  const fecha = new Date().toISOString().slice(0, 10)

  await downloadExcelWorkbook({
    filename: `catalogo-productos_${fecha}`,
    sheets: [
      {
        name: 'Catálogo',
        rows,
        columns: [
          { key: 'codigo', header: 'Código', width: 18, value: (r) => r.codigo },
          {
            key: 'ubicacion',
            header: 'Ubicación',
            width: 16,
            value: (r) => r.codigo_ubicacion,
          },
          { key: 'nombre', header: 'Nombre', width: 36, value: (r) => r.nombre },
          { key: 'marca', header: 'Marca', width: 16, value: (r) => r.marca },
          {
            key: 'presentacion',
            header: 'Presentación',
            width: 40,
            value: (r) => r.presentacion,
          },
          {
            key: 'categoria',
            header: 'Categoría',
            width: 22,
            value: (r) => r.nombre_categoria,
          },
          {
            key: 'subcategoria',
            header: 'Subcategoría',
            width: 22,
            value: (r) => r.nombre_sub_categoria,
          },
          { key: 'tipo', header: 'Tipo', width: 12, value: tipoItem },
          {
            key: 'um',
            header: 'U.M.',
            width: 10,
            value: (r) => r.nombre_unidad_medida,
          },
          { key: 'pv', header: 'Precio venta', width: 14, value: (r) => Number(r.precio ?? 0) },
          {
            key: 'pc',
            header: 'Precio compra',
            width: 14,
            value: (r) => Number(r.precio_compra ?? 0),
          },
          {
            key: 'pg',
            header: 'Precio garantía',
            width: 16,
            value: (r) => Number(r.precio_garantia ?? 0),
          },
          {
            key: 'estado',
            header: 'Estado',
            width: 12,
            value: (r) => (r.estado === 1 ? 'Activo' : 'Inactivo'),
          },
        ],
      },
    ],
  })
}
