import { downloadExcelWorkbook, type ExcelColumn } from '@/shared/utils/exportExcel'
import type { RecargaPlantaProtocoloFila } from '@/modules/balones/recargas/interfaces/recarga-planta.interface'

const formatDoc = (serie?: string | null, numero?: string | null) => {
  if (!serie && !numero) return ''
  if (serie && numero) return `${serie}-${numero}`
  return serie || numero || ''
}

const formatDate = (value?: string | null) => (value ? value.slice(0, 10) : '')

const columns: ExcelColumn<RecargaPlantaProtocoloFila>[] = [
  {
    key: 'numero_orden',
    header: 'Orden',
    width: 14,
    value: (row) => row.numero_orden || `RP-${row.id_recarga_planta}`,
  },
  {
    key: 'nombre_estado',
    header: 'Estado',
    width: 12,
    value: (row) => row.nombre_estado,
  },
  {
    key: 'fecha_salida',
    header: 'Fecha ida',
    width: 12,
    value: (row) => formatDate(row.fecha_salida),
  },
  {
    key: 'nombre_proveedor',
    header: 'Proveedor / planta',
    width: 28,
    value: (row) => row.nombre_proveedor,
  },
  {
    key: 'nombre_almacen',
    header: 'Almacén',
    width: 22,
    value: (row) => row.nombre_almacen,
  },
  {
    key: 'gre_salida',
    header: 'GRE salida',
    width: 14,
    value: (row) => formatDoc(row.serie_guia_salida, row.numero_guia_salida),
  },
  {
    key: 'gre_retorno',
    header: 'GRE retorno',
    width: 14,
    value: (row) => formatDoc(row.serie_guia_ingreso, row.numero_guia_ingreso),
  },
  {
    key: 'factura',
    header: 'Factura',
    width: 14,
    value: (row) => formatDoc(row.serie_factura, row.numero_factura),
  },
  {
    key: 'fecha_llegada_almacen',
    header: 'Fecha retorno',
    width: 12,
    value: (row) => formatDate(row.fecha_llegada_almacen),
  },
  {
    key: 'lote',
    header: 'Nº lote',
    width: 16,
    value: (row) => row.lote,
  },
  {
    key: 'fecha_vencimiento_lote',
    header: 'Venc. lote',
    width: 12,
    value: (row) => formatDate(row.fecha_vencimiento_lote),
  },
  {
    key: 'codigo_balon',
    header: 'Código cilindro',
    width: 16,
    value: (row) => row.codigo_balon,
  },
  {
    key: 'nombre_producto',
    header: 'Gas / producto',
    width: 24,
    value: (row) => row.nombre_producto,
  },
  {
    key: 'capacidad',
    header: 'Capacidad',
    width: 12,
    value: (row) => {
      if (row.capacidad == null) return ''
      return row.nombre_unidad_medida
        ? `${row.capacidad} ${row.nombre_unidad_medida}`
        : String(row.capacidad)
    },
  },
  {
    key: 'fecha_prueba_hidrostatica',
    header: 'P.H.',
    width: 12,
    value: (row) => formatDate(row.fecha_prueba_hidrostatica),
  },
]

export async function exportarProtocoloRecargaPlantaExcel(
  rows: RecargaPlantaProtocoloFila[],
  opts?: { filename?: string },
) {
  const hoy = new Date().toISOString().slice(0, 10)
  await downloadExcelWorkbook({
    filename: opts?.filename ?? `protocolo-recarga-planta-${hoy}.xlsx`,
    sheets: [
      {
        name: 'Protocolo planta',
        columns,
        rows,
      },
    ],
  })
}
