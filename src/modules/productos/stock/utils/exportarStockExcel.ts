import { stockService } from '@/modules/productos/stock/services/stock.service'
import type { StockListFilters } from '@/modules/productos/stock/interfaces/stock.interface'
import { toastInfo } from '@/shared/composables/useToast'
import { downloadExcelWorkbook, fetchAllPages } from '@/shared/utils/exportExcel'

export async function exportarStockExcel(filters: StockListFilters): Promise<void> {
  const rows = await fetchAllPages(stockService.listar, filters)

  if (!rows.length) {
    toastInfo('No hay stock que coincida con los filtros actuales')
    return
  }

  const fecha = new Date().toISOString().slice(0, 10)

  await downloadExcelWorkbook({
    filename: `stock-accesorios_${fecha}`,
    sheets: [
      {
        name: 'Stock',
        rows,
        columns: [
          {
            key: 'almacen',
            header: 'Almacén',
            width: 36,
            value: (r) => r.nombre_almacen,
          },
          {
            key: 'sucursal',
            header: 'Sucursal',
            width: 22,
            value: (r) => r.nombre_sucursal,
          },
          {
            key: 'codigo',
            header: 'Código',
            width: 18,
            value: (r) => r.codigo_producto,
          },
          {
            key: 'producto',
            header: 'Producto',
            width: 36,
            value: (r) => r.nombre_producto,
          },
          {
            key: 'categoria',
            header: 'Categoría',
            width: 20,
            value: (r) => r.nombre_categoria,
          },
          {
            key: 'subcategoria',
            header: 'Subcategoría',
            width: 20,
            value: (r) => r.nombre_sub_categoria,
          },
          {
            key: 'um',
            header: 'U.M.',
            width: 10,
            value: (r) => r.nombre_unidad_medida,
          },
          { key: 'saldo', header: 'Saldo', width: 12, value: (r) => Number(r.stock ?? 0) },
          {
            key: 'minimo',
            header: 'Mínimo',
            width: 12,
            value: (r) => Number(r.stock_minimo ?? 0),
          },
          {
            key: 'alerta',
            header: 'Alerta',
            width: 14,
            value: (r) => (r.bajo_minimo ? 'Bajo mínimo' : 'OK'),
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
