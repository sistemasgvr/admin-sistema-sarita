import { comprasService } from '@/modules/compras/services/compras.service'
import type { Compra, CompraListFilters } from '@/modules/compras/interfaces/compra.interface'
import { toastInfo } from '@/shared/composables/useToast'
import { hoyIsoLima } from '@/shared/utils/date'
import { downloadExcelWorkbook, fetchAllPages, type ExcelColumn } from '@/shared/utils/exportExcel'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

type Campo<T> = [keyof T & string, string, number?]
function columnas<T>(campos: Campo<T>[]): ExcelColumn<T>[] {
  return campos.map(([key, header, width = 20]) => ({
    key,
    header,
    width,
    value: (row) => {
      const value = row[key]
      if (typeof value === 'boolean') return value ? 'Sí' : 'No'
      if (value == null) return ''
      if (key === 'estado') return Number(value) === 1 ? 'Activo' : 'Anulado'
      if (key === 'tipo_registro' || key === 'categoria_gasto')
        return formatListaOpcionLabel(String(value))
      return typeof value === 'number' ? value : String(value)
    },
  }))
}

export function crearHojasCompras(compras: Compra[]) {
  const cabeceras = compras.map(({ cabecera: c }) => ({
    ...c,
    tiene_comprobante: Boolean(c.serie?.trim() && c.numero?.trim()),
  }))
  const relacionadas = compras.map(({ cabecera: c, ...compra }) => ({
    ...compra,
    origen: {
      id_compra: c.id,
      serie: c.serie,
      numero: c.numero,
      fecha_compra: c.fecha,
      proveedor: c.proveedor,
      proveedor_documento: c.proveedor_documento,
      moneda: c.moneda,
    },
  }))
  type Origen = (typeof relacionadas)[number]['origen']
  const origen: Campo<Origen>[] = [
    ['id_compra', 'ID compra'],
    ['serie', 'Serie', 12],
    ['numero', 'Número', 16],
    ['fecha_compra', 'Fecha compra', 14],
    ['proveedor', 'Proveedor', 36],
    ['proveedor_documento', 'Documento proveedor', 22],
    ['moneda', 'Moneda'],
  ]
  const detalles = relacionadas.flatMap(({ origen, detalle }) =>
    detalle.map((d) => ({ ...origen, ...d })),
  )
  const cuentas = relacionadas.flatMap(({ origen, cuenta_por_pagar: c }) =>
    c ? [{ ...origen, ...c }] : [],
  )
  const cuotas = relacionadas.flatMap(({ origen, cuenta_por_pagar: c }) =>
    c ? c.cuotas.map((cuota) => ({ ...origen, id_cuenta: c.id, ...cuota })) : [],
  )
  return [
    {
      name: 'Compras',
      rows: cabeceras,
      columns: columnas<(typeof cabeceras)[number]>([
        ['id', 'ID compra'],
        ['serie', 'Serie', 12],
        ['numero', 'Número', 16],
        ['fecha', 'Fecha', 14],
        ['id_tipo_comprobante', 'ID tipo comprobante'],
        ['tipo_comprobante', 'Tipo comprobante'],
        ['tiene_comprobante', 'Tiene comprobante'],
        ['id_proveedor', 'ID proveedor'],
        ['proveedor', 'Proveedor', 36],
        ['proveedor_documento', 'Documento proveedor', 22],
        ['id_tipo_registro', 'ID tipo registro'],
        ['tipo_registro', 'Tipo registro'],
        ['id_categoria_gasto', 'ID categoría gasto'],
        ['categoria_gasto', 'Categoría gasto'],
        ['id_sucursal', 'ID sucursal'],
        ['sucursal', 'Sucursal', 28],
        ['id_almacen', 'ID almacén'],
        ['almacen', 'Almacén', 28],
        ['id_moneda', 'ID moneda'],
        ['moneda', 'Moneda'],
        ['id_condicion_pago', 'ID condición pago'],
        ['condicion_pago', 'Condición de pago', 26],
        ['sub_total', 'Subtotal', 16],
        ['igv', 'IGV', 16],
        ['total_importe', 'Total', 16],
        ['afecta_inventario', 'Afecta inventario'],
        ['declarar_sunat', 'Declarar SUNAT'],
        ['glosa', 'Glosa', 50],
        ['id_estado', 'ID estado pago'],
        ['estado_pago', 'Estado de pago'],
        ['estado', 'Estado'],
        ['id_comprobante_referencia', 'ID compra referencia', 24],
        ['id_recarga_planta', 'ID recarga planta'],
        ['numero_recarga_planta', 'Número recarga planta', 24],
        ['tiene_movimientos_inventario', 'Movimientos inventario', 24],
        ['puede_modificarse_parcial', 'Permite modificación'],
        ['fecha_creacion', 'Fecha creación', 28],
        ['fecha_modificacion', 'Fecha modificación', 28],
      ]),
    },
    {
      name: 'Detalle',
      rows: detalles,
      columns: columnas<(typeof detalles)[number]>([
        ...origen,
        ['id', 'ID detalle'],
        ['item', 'Ítem'],
        ['id_producto', 'ID producto'],
        ['codigo_producto', 'Código producto'],
        ['nombre_producto', 'Producto', 40],
        ['descripcion', 'Descripción', 50],
        ['id_unidad_medida', 'ID unidad medida'],
        ['unidad_medida', 'Unidad de medida'],
        ['id_almacen', 'ID almacén'],
        ['almacen', 'Almacén', 28],
        ['cantidad', 'Cantidad', 16],
        ['precio_unitario', 'Precio unitario', 18],
        ['importe', 'Importe', 16],
        ['afecta_stock', 'Afecta stock'],
        ['es_gas', 'Es gas'],
        ['id_clasificacion_gasto', 'ID clasificación gasto', 24],
        ['clasificacion_gasto', 'Clasificación gasto', 45],
        ['id_estado_pago', 'ID estado pago'],
        ['fecha_pago', 'Fecha pago'],
        ['estado', 'Estado'],
      ]),
    },
    {
      name: 'Cuentas por pagar',
      rows: cuentas,
      columns: columnas<(typeof cuentas)[number]>([
        ...origen,
        ['id', 'ID cuenta'],
        ['descripcion', 'Descripción', 45],
        ['numero_cuotas_total', 'Número de cuotas'],
        ['monto_pendiente', 'Monto cuenta', 18],
        ['monto_abonado', 'Abonado', 18],
        ['saldo', 'Saldo', 18],
        ['fecha_vencimiento', 'Vencimiento', 18],
      ]),
    },
    {
      name: 'Cuotas',
      rows: cuotas,
      columns: columnas<(typeof cuotas)[number]>([
        ...origen,
        ['id_cuenta', 'ID cuenta'],
        ['id', 'ID cuota'],
        ['numero_cuota', 'Número cuota'],
        ['fecha_vencimiento', 'Vencimiento', 18],
        ['monto_pendiente', 'Monto cuota', 18],
        ['monto_abonado', 'Abonado', 18],
        ['saldo', 'Saldo', 18],
      ]),
    },
  ] as const
}

export async function exportarComprasExcel(filters: CompraListFilters): Promise<void> {
  const rows = await fetchAllPages(comprasService.listar, { ...filters })
  if (!rows.length) {
    toastInfo('No hay compras que coincidan con los filtros actuales')
    return
  }
  // Limita la carga y conserva el orden. Cualquier error cancela la descarga
  // para evitar entregar un reporte incompleto.
  const compras: Compra[] = []
  for (let i = 0; i < rows.length; i += 5) {
    compras.push(
      ...(await Promise.all(rows.slice(i, i + 5).map((r) => comprasService.obtenerPorId(r.id)))),
    )
  }
  await downloadExcelWorkbook({
    filename: `compras_${hoyIsoLima()}`,
    sheets: [...crearHojasCompras(compras)],
  })
}
