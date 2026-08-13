import { downloadExcelWorkbook, type ExcelColumn } from '@/shared/utils/exportExcel'
import type {
  BalonPropietarioItem,
  BalonPropietarioResumen,
} from '@/modules/balones/propietario/interfaces/balon-propietario.interface'

type ResumenFila = {
  concepto: string
  detalle: string
  cantidad: number | string
}

const formatPh = (value?: string | null) => (value ? value.slice(0, 10) : '')

const detalleColumns: ExcelColumn<BalonPropietarioItem>[] = [
  {
    key: 'codigo',
    header: 'Código',
    width: 14,
    value: (row) => row.codigo_balon,
  },
  {
    key: 'serie',
    header: 'Serie',
    width: 14,
    value: (row) => row.numero_serie,
  },
  {
    key: 'propietario',
    header: 'Propietario',
    width: 12,
    value: (row) => row.nombre_propietario,
  },
  {
    key: 'titular',
    header: 'Titular / proveedor',
    width: 28,
    value: (row) => row.nombre_titular,
  },
  {
    key: 'tipo',
    header: 'Tipo',
    width: 16,
    value: (row) => row.nombre_tipo_balon,
  },
  {
    key: 'gas',
    header: 'Gas',
    width: 22,
    value: (row) => row.nombre_producto_gas,
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
    key: 'estado',
    header: 'Estado',
    width: 14,
    value: (row) => row.nombre_estado_balon,
  },
  {
    key: 'contenido',
    header: 'Contenido',
    width: 12,
    value: (row) => row.nombre_estado_contenido,
  },
  {
    key: 'almacen',
    header: 'Almacén',
    width: 24,
    value: (row) => row.nombre_almacen,
  },
  {
    key: 'ph',
    header: 'P.H. próxima',
    width: 12,
    value: (row) => formatPh(row.fecha_proxima_prueba_hidrostatica),
  },
]

const resumenColumns: ExcelColumn<ResumenFila>[] = [
  { key: 'concepto', header: 'Concepto', width: 22, value: (row) => row.concepto },
  { key: 'detalle', header: 'Detalle', width: 32, value: (row) => row.detalle },
  { key: 'cantidad', header: 'Cantidad', width: 12, value: (row) => row.cantidad },
]

function buildResumenRows(resumen: BalonPropietarioResumen): ResumenFila[] {
  const rows: ResumenFila[] = [
    { concepto: 'Total', detalle: 'Todos los cilindros', cantidad: resumen.total ?? 0 },
    { concepto: 'Empresa', detalle: 'Propiedad de la empresa', cantidad: resumen.empresa ?? 0 },
    {
      concepto: 'Planta / proveedor',
      detalle: 'Envases de planta externa',
      cantidad: resumen.planta ?? 0,
    },
    {
      concepto: 'Cliente',
      detalle: 'Envases propios del cliente',
      cantidad: resumen.cliente ?? 0,
    },
  ]

  if ((resumen.otros ?? 0) > 0) {
    rows.push({
      concepto: 'Otros',
      detalle: 'Sin tipo o valor no estándar',
      cantidad: resumen.otros ?? 0,
    })
  }

  for (const item of resumen.por_planta ?? []) {
    rows.push({
      concepto: 'Por planta',
      detalle: item.nombre_planta || 'Sin proveedor',
      cantidad: item.cantidad,
    })
  }

  for (const item of resumen.por_cliente ?? []) {
    rows.push({
      concepto: 'Por cliente',
      detalle: item.nombre_cliente_propietario || 'Sin cliente',
      cantidad: item.cantidad,
    })
  }

  return rows
}

export async function exportarBalonesPropietarioExcel(opts: {
  detalle: BalonPropietarioItem[]
  resumen: BalonPropietarioResumen
  filename?: string
}) {
  const hoy = new Date().toISOString().slice(0, 10)

  await downloadExcelWorkbook({
    filename: opts.filename ?? `balones-por-propietario-${hoy}.xlsx`,
    sheets: [
      {
        name: 'Resumen',
        columns: resumenColumns,
        rows: buildResumenRows(opts.resumen),
      },
      {
        name: 'Detalle',
        columns: detalleColumns,
        rows: opts.detalle,
      },
    ],
  })
}
