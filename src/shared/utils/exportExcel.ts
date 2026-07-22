export type ExcelColumn<T> = {
  key: string
  header: string
  width?: number
  value: (row: T) => string | number | null | undefined
}

export async function downloadExcel<T>(options: {
  filename: string
  sheetName?: string
  columns: ExcelColumn<T>[]
  rows: T[]
}) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema Sarita'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(options.sheetName || 'Datos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = options.columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width ?? Math.max(12, column.header.length + 2),
  }))

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle' }

  for (const row of options.rows) {
    const record: Record<string, string | number> = {}
    for (const column of options.columns) {
      const value = column.value(row)
      record[column.key] = value == null ? '' : value
    }
    sheet.addRow(record)
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
