export type ExcelColumn<T> = {
  key: string
  header: string
  width?: number
  value: (row: T) => string | number | null | undefined
}

export interface ExcelSheetSpec<T> {
  name: string
  columns: ExcelColumn<T>[]
  rows: T[]
  /** Fila de título arriba del encabezado (ej. "Direcciones — Total: 128 registros"). */
  title?: string
  /** Color de acento de la hoja (ARGB, ej. 'FF2563EB'). Sin esto, el encabezado queda en blanco y negrita simple. */
  accentColor?: string
  /**
   * Nivel de agrupado (0 = fila "resumen"/visible, 1+ = fila de detalle
   * colapsable). Si se define, las filas con nivel > 0 se agregan ya
   * colapsadas y Excel muestra los controles +/- para expandirlas.
   */
  outlineLevel?: (row: T) => number
  /** Filas que deben resaltarse en negrita (ej. la primera fila de cada grupo). */
  bold?: (row: T) => boolean
}

/** Tipografía y paleta compartidas con la web (azul Oxígeno, verde/rojo del logo, grises). */
export const REPORT_FONT = 'Segoe UI'
export const REPORT_COLORS = {
  /** Azul Oxígeno (brand-600): banner principal / títulos de sección. */
  acento: 'FF0D47A1',
  /** Azul Oxígeno muy claro (brand-50): fondo suave para barras de sección secundarias. */
  acentoSuave: 'FFE3F2FD',
  encabezadoFondo: 'FFFFFFFF',
  encabezadoTexto: 'FF374151', // gray-800
  textoClaro: 'FFFFFFFF',
  bordeClaro: 'FFD1D5DB', // gray-300
  exito: 'FF087A38', // success-600
  exitoSuave: 'FFE8F5E9', // success-50
  alerta: 'FFC62828', // sarita-600
  alertaSuave: 'FFFDECEA',
  gris400: 'FF9CA3AF',
  gris500: 'FF6B7280',
} as const

const BORDER_COLOR = { argb: 'FFE5E7EB' } // gray-200
const THIN_BORDER = {
  top: { style: 'thin' as const, color: BORDER_COLOR },
  left: { style: 'thin' as const, color: BORDER_COLOR },
  bottom: { style: 'thin' as const, color: BORDER_COLOR },
  right: { style: 'thin' as const, color: BORDER_COLOR },
}

function addSheet<T>(workbook: import('exceljs').Workbook, spec: ExcelSheetSpec<T>) {
  const hasTitle = Boolean(spec.title)
  const headerRowNumber = hasTitle ? 2 : 1
  const acento = spec.accentColor ?? REPORT_COLORS.acento

  const sheet = workbook.addWorksheet(spec.name, {
    views: [{ state: 'frozen', ySplit: headerRowNumber }],
  })

  if (spec.outlineLevel) {
    // Resumen arriba de su detalle: colapsar el grupo oculta las filas de abajo.
    sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false }
  }

  sheet.columns = spec.columns.map((column) => ({
    key: column.key,
    width: column.width ?? Math.max(12, column.header.length + 2),
  }))

  if (hasTitle) {
    sheet.mergeCells(1, 1, 1, spec.columns.length)
    const titleCell = sheet.getCell(1, 1)
    titleCell.value = spec.title
    titleCell.font = { name: REPORT_FONT, bold: true, size: 13, color: { argb: REPORT_COLORS.textoClaro } }
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: acento } }
    sheet.getRow(1).height = 26
  }

  // Encabezado de columnas: minimalista (blanco + texto gris), sin competir
  // visualmente con la barra de título de arriba.
  const headerRow = sheet.getRow(headerRowNumber)
  spec.columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = column.header
    cell.font = { name: REPORT_FONT, bold: true, size: 10, color: { argb: REPORT_COLORS.encabezadoTexto } }
    cell.alignment = { vertical: 'middle' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.encabezadoFondo } }
    cell.border = { ...THIN_BORDER, bottom: { style: 'thin', color: { argb: REPORT_COLORS.bordeClaro } } }
  })

  for (const row of spec.rows) {
    const record: Record<string, string | number> = {}
    for (const column of spec.columns) {
      const value = column.value(row)
      record[column.key] = value == null ? '' : value
    }
    const excelRow = sheet.addRow(record)

    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = THIN_BORDER
      cell.font = { name: REPORT_FONT, size: 10 }
    })

    if (spec.outlineLevel) {
      const level = spec.outlineLevel(row)
      excelRow.outlineLevel = level
      if (level > 0) excelRow.hidden = true
    }

    if (spec.bold?.(row)) {
      excelRow.font = { name: REPORT_FONT, size: 10, bold: true }
    }
  }
}

export async function downloadExcelWorkbook(options: {
  filename: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cada hoja puede tener su propio tipo de fila
  sheets: ExcelSheetSpec<any>[]
}) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema Sarita'
  workbook.created = new Date()

  for (const sheetSpec of options.sheets) {
    addSheet(workbook, sheetSpec)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = options.filename.endsWith('.xlsx')
    ? options.filename
    : `${options.filename}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

/** Atajo para exportar una sola hoja sin título ni color (uso simple). */
export async function downloadExcel<T>(options: {
  filename: string
  sheetName?: string
  columns: ExcelColumn<T>[]
  rows: T[]
  outlineLevel?: (row: T) => number
  bold?: (row: T) => boolean
}) {
  return downloadExcelWorkbook({
    filename: options.filename,
    sheets: [
      {
        name: options.sheetName || 'Datos',
        columns: options.columns,
        rows: options.rows,
        outlineLevel: options.outlineLevel,
        bold: options.bold,
      },
    ],
  })
}
