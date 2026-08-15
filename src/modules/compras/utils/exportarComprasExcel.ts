import { comprasService } from '@/modules/compras/services/compras.service'
import type { CompraListFilters } from '@/modules/compras/interfaces/compra.interface'
import { toastInfo } from '@/shared/composables/useToast'
import { hoyIsoLima } from '@/shared/utils/date'
import { downloadExcelWorkbook, fetchAllPages } from '@/shared/utils/exportExcel'

export async function exportarComprasExcel(filters: CompraListFilters): Promise<void> {
  const rows = await fetchAllPages(comprasService.listar, filters)

  if (!rows.length) {
    toastInfo('No hay compras que coincidan con los filtros actuales')
    return
  }

  await downloadExcelWorkbook({
    filename: `compras_${hoyIsoLima()}`,
    sheets: [
      {
        name: 'Compras',
        rows,
        columns: [
          { key: 'serie', header: 'Serie', width: 12, value: (r) => r.serie },
          { key: 'numero', header: 'Número', width: 14, value: (r) => r.numero },
          {
            key: 'fecha',
            header: 'Fecha',
            width: 14,
            value: (r) => r.fecha?.slice(0, 10),
          },
          {
            key: 'proveedor',
            header: 'Proveedor',
            width: 36,
            value: (r) => r.nombre_proveedor || r.proveedor,
          },
          { key: 'almacen', header: 'Almacén', width: 28, value: (r) => r.almacen },
          {
            key: 'sub_total',
            header: 'Subtotal',
            width: 14,
            value: (r) => Number(r.sub_total ?? 0),
          },
          {
            key: 'total_importe',
            header: 'Total',
            width: 14,
            value: (r) => Number(r.total_importe ?? 0),
          },
          {
            key: 'estado',
            header: 'Estado',
            width: 12,
            value: (r) => (r.estado === 1 ? 'Activo' : 'Anulado'),
          },
          {
            key: 'tiene_movimientos_inventario',
            header: 'Movimientos inventario',
            width: 22,
            value: (r) => (r.tiene_movimientos_inventario ? 'Sí' : 'No'),
          },
          {
            key: 'id_comprobante_referencia',
            header: 'ID comprobante referencia',
            width: 24,
            value: (r) => r.id_comprobante_referencia,
          },
        ],
      },
    ],
  })
}
