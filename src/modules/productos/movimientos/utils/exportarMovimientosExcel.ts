import { movimientosInventarioService } from '@/modules/productos/movimientos/services/movimientos-inventario.service'
import type { MovimientoInventarioListFilters } from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import { toastInfo } from '@/shared/composables/useToast'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import { downloadExcelWorkbook, fetchAllPages } from '@/shared/utils/exportExcel'

export async function exportarMovimientosExcel(
  filters: MovimientoInventarioListFilters,
): Promise<void> {
  const rows = await fetchAllPages(movimientosInventarioService.listar, filters)

  if (!rows.length) {
    toastInfo('No hay movimientos que coincidan con los filtros actuales')
    return
  }

  const fecha = new Date().toISOString().slice(0, 10)

  await downloadExcelWorkbook({
    filename: `movimientos-accesorios_${fecha}`,
    sheets: [
      {
        name: 'Movimientos',
        rows,
        columns: [
          {
            key: 'fecha',
            header: 'Fecha',
            width: 14,
            value: (r) => r.fecha?.slice(0, 10),
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
            key: 'almacen',
            header: 'Almacén',
            width: 36,
            value: (r) => r.nombre_almacen,
          },
          {
            key: 'tipo',
            header: 'Tipo',
            width: 16,
            value: (r) => formatListaOpcionLabel(r.nombre_tipo_movimiento),
          },
          {
            key: 'cantidad',
            header: 'Cantidad',
            width: 12,
            value: (r) => Number(r.cantidad ?? 0),
          },
          {
            key: 'um',
            header: 'U.M.',
            width: 10,
            value: (r) => r.nombre_unidad_medida,
          },
          {
            key: 'sa',
            header: 'Stock anterior',
            width: 14,
            value: (r) => (r.stock_anterior == null ? '' : Number(r.stock_anterior)),
          },
          {
            key: 'sn',
            header: 'Stock nuevo',
            width: 14,
            value: (r) => (r.stock_nuevo == null ? '' : Number(r.stock_nuevo)),
          },
          {
            key: 'doc',
            header: 'Documento',
            width: 16,
            value: (r) => formatListaOpcionLabel(r.nombre_tipo_documento_ref),
          },
          {
            key: 'idDoc',
            header: 'ID documento',
            width: 14,
            value: (r) => r.id_documento_ref,
          },
          { key: 'glosa', header: 'Glosa', width: 40, value: (r) => r.glosa },
        ],
      },
    ],
  })
}
