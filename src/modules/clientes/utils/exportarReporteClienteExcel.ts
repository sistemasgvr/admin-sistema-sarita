import { toastInfo } from '@/shared/composables/useToast'
import { REPORT_COLORS, REPORT_FONT } from '@/shared/utils/exportExcel'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import { getClienteNombrePrincipal } from '@/modules/clientes/utils/clienteNombre'
import { estadoTexto, siNo } from '@/modules/clientes/utils/exportExcelHelpers'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import { cuentasBancariasService } from '@/modules/cuentas-bancarias/services/cuentas-bancarias.service'
import { prestamosAntiguedadService } from '@/modules/balones/prestamos/services/prestamos-antiguedad.service'
import type { RangoAntiguedadPrestamo } from '@/modules/balones/prestamos/interfaces/prestamo-antiguedad.interface'
import { alquileresAntiguedadService } from '@/modules/balones/alquileres/services/alquileres-antiguedad.service'
import type { RangoAntiguedadAlquiler } from '@/modules/balones/alquileres/interfaces/alquiler-antiguedad.interface'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'

// ─── Estilos / layout ────────────────────────────────────────────────────────
// Un solo banner "hero" arriba (el nombre del cliente) y barras de sección en
// un tono azul muy claro debajo — el color fuerte queda reservado para ese
// banner y para las alertas (antigüedad/vencido), no para "pintar" cada tabla.

const ACENTO = REPORT_COLORS.acento
const NUM_COLUMNAS = 8
const MITAD = NUM_COLUMNAS / 2
const ANCHOS_COLUMNAS = [20, 15, 15, 14, 20, 15, 15, 14]

const BORDE = { argb: 'FFE5E7EB' } // gray-200
const THIN_BORDER = {
  top: { style: 'thin' as const, color: BORDE },
  left: { style: 'thin' as const, color: BORDE },
  bottom: { style: 'thin' as const, color: BORDE },
  right: { style: 'thin' as const, color: BORDE },
}

/** Etiqueta/color por rango de antigüedad, mismo criterio que las vistas de préstamos/alquileres. */
const RANGO_LABEL: Record<RangoAntiguedadPrestamo | RangoAntiguedadAlquiler, string> = {
  CRITICO_180: '180+ días',
  SEGUIMIENTO_90_180: '90–180 días',
  ATENCION_30_90: '30–90 días',
  RECIENTE_0_30: '< 30 días',
  DEVUELTO: 'Devuelto',
}
/** Tintes suaves ligados a los colores reales de la app (éxito/ámbar/error/gris). */
const RANGO_FILL: Record<RangoAntiguedadPrestamo | RangoAntiguedadAlquiler, string> = {
  CRITICO_180: REPORT_COLORS.alertaSuave,
  SEGUIMIENTO_90_180: 'FFFEF3C7',
  ATENCION_30_90: 'FFFFFBEB',
  RECIENTE_0_30: REPORT_COLORS.exitoSuave,
  DEVUELTO: 'FFF3F4F6',
}

const formatMoney = (value: number | null | undefined) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value ?? 0)

// ─── Helpers de escritura de celdas ──────────────────────────────────────────

type Sheet = import('exceljs').Worksheet

/** Banner alto con el nombre del cliente + insignia de estado (única franja de color fuerte del reporte). */
function writeHeroBanner(sheet: Sheet, nombreCliente: string, activo: boolean) {
  for (let r = 1; r <= 2; r++) {
    for (let c = 1; c <= NUM_COLUMNAS; c++) {
      sheet.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACENTO } }
    }
  }

  sheet.mergeCells(1, 1, 1, NUM_COLUMNAS - 2)
  const nameCell = sheet.getCell(1, 1)
  nameCell.value = nombreCliente
  nameCell.font = { name: REPORT_FONT, bold: true, size: 16, color: { argb: REPORT_COLORS.textoClaro } }
  nameCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  sheet.mergeCells(1, NUM_COLUMNAS - 1, 1, NUM_COLUMNAS)
  const badgeCell = sheet.getCell(1, NUM_COLUMNAS - 1)
  badgeCell.value = activo ? '● Activo' : '● Inactivo'
  badgeCell.font = {
    name: REPORT_FONT,
    bold: true,
    size: 10,
    color: { argb: activo ? REPORT_COLORS.exito : REPORT_COLORS.alerta },
  }
  badgeCell.alignment = { vertical: 'middle', horizontal: 'center' }
  badgeCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: activo ? REPORT_COLORS.exitoSuave : REPORT_COLORS.alertaSuave },
  }

  sheet.mergeCells(2, 1, 2, NUM_COLUMNAS)
  const subtitleCell = sheet.getCell(2, 1)
  subtitleCell.value = 'Reporte general'
  subtitleCell.font = { name: REPORT_FONT, size: 10, color: { argb: 'FFBFDBFE' } }
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  sheet.getRow(1).height = 28
  sheet.getRow(2).height = 18
}

/** Tarjeta de perfil: etiqueta pequeña arriba + valor en negrita abajo, dentro de la misma celda. */
function writeInfoTile(
  sheet: Sheet,
  row: number,
  col: number,
  colSpan: number,
  label: string,
  value: string | number | null | undefined,
) {
  if (colSpan > 1) sheet.mergeCells(row, col, row, col + colSpan - 1)
  const cell = sheet.getCell(row, col)
  cell.value = {
    richText: [
      { font: { name: REPORT_FONT, size: 9, color: { argb: REPORT_COLORS.gris500 } }, text: `${label}\n` },
      {
        font: { name: REPORT_FONT, size: 11, bold: true, color: { argb: REPORT_COLORS.encabezadoTexto } },
        text: value == null || value === '' ? '—' : String(value),
      },
    ],
  }
  cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left', indent: 1 }
  cell.border = THIN_BORDER
}

/** Marco exterior tipo tarjeta alrededor de un rango de celdas ya escrito. */
function writeCardBorder(sheet: Sheet, r1: number, c1: number, r2: number, c2: number) {
  for (let c = c1; c <= c2; c++) {
    sheet.getCell(r1, c).border = { ...sheet.getCell(r1, c).border, top: { style: 'medium', color: BORDE } }
    sheet.getCell(r2, c).border = { ...sheet.getCell(r2, c).border, bottom: { style: 'medium', color: BORDE } }
  }
  for (let r = r1; r <= r2; r++) {
    sheet.getCell(r, c1).border = { ...sheet.getCell(r, c1).border, left: { style: 'medium', color: BORDE } }
    sheet.getCell(r, c2).border = { ...sheet.getCell(r, c2).border, right: { style: 'medium', color: BORDE } }
  }
}

/** Tarjeta KPI: etiqueta a la izquierda, valor en negrita a la derecha, franja de color solo si es una alerta. */
function writeKpiTile(sheet: Sheet, row: number, col: number, label: string, value: number, accent: string) {
  const labelCell = sheet.getCell(row, col)
  labelCell.value = label
  labelCell.font = { name: REPORT_FONT, size: 9, color: { argb: REPORT_COLORS.gris500 } }
  labelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true }
  labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } }
  labelCell.border = { ...THIN_BORDER, left: { style: 'medium', color: { argb: accent } } }

  const valueCell = sheet.getCell(row, col + 1)
  valueCell.value = value
  valueCell.font = { name: REPORT_FONT, bold: true, size: 12, color: { argb: REPORT_COLORS.encabezadoTexto } }
  valueCell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
  valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } }
  valueCell.border = THIN_BORDER
}

function writeKpiRow(sheet: Sheet, row: number, tiles: { label: string; value: number; accent: string }[]) {
  tiles.forEach((tile, index) => writeKpiTile(sheet, row, index * 2 + 1, tile.label, tile.value, tile.accent))
  sheet.getRow(row).height = 26
}

/** Barra de sección en azul muy claro (no compite con el banner principal), con insignia opcional a la derecha. */
function writeSectionBar(
  sheet: Sheet,
  row: number,
  startCol: number,
  numCols: number,
  text: string,
  badge?: { text: string; bg: string; color: string },
) {
  const badgeCols = badge ? Math.max(2, Math.round(numCols / 3)) : 0
  const titleCols = numCols - badgeCols

  sheet.mergeCells(row, startCol, row, startCol + titleCols - 1)
  const titleCell = sheet.getCell(row, startCol)
  titleCell.value = text
  titleCell.font = { name: REPORT_FONT, bold: true, size: 10.5, color: { argb: ACENTO } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.acentoSuave } }

  if (badge) {
    sheet.mergeCells(row, startCol + titleCols, row, startCol + numCols - 1)
    const badgeCell = sheet.getCell(row, startCol + titleCols)
    badgeCell.value = badge.text
    badgeCell.font = { name: REPORT_FONT, bold: true, size: 9, color: { argb: badge.color } }
    badgeCell.alignment = { vertical: 'middle', horizontal: 'center' }
    badgeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: badge.bg } }
  }

  sheet.getRow(row).height = 20
}

function writeSectionHeader(sheet: Sheet, row: number, startCol: number, headers: string[]) {
  headers.forEach((header, index) => {
    const cell = sheet.getCell(row, startCol + index)
    cell.value = header
    cell.font = { name: REPORT_FONT, bold: true, size: 9.5, color: { argb: REPORT_COLORS.gris500 } }
    cell.alignment = { vertical: 'middle' }
    cell.border = { ...THIN_BORDER, bottom: { style: 'thin', color: { argb: REPORT_COLORS.bordeClaro } } }
  })
}

function writeDataRow(
  sheet: Sheet,
  row: number,
  startCol: number,
  values: (string | number | null | undefined)[],
  fillArgb?: string,
) {
  values.forEach((value, index) => {
    const cell = sheet.getCell(row, startCol + index)
    cell.value = value == null ? '' : value
    cell.font = { name: REPORT_FONT, size: 9.5 }
    cell.border = THIN_BORDER
    if (fillArgb) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } }
    }
  })
}

function writeEmptyNotice(sheet: Sheet, row: number, startCol: number, numCols: number, texto: string) {
  sheet.mergeCells(row, startCol, row, startCol + numCols - 1)
  const cell = sheet.getCell(row, startCol)
  cell.value = texto
  cell.font = { name: REPORT_FONT, italic: true, size: 9.5, color: { argb: REPORT_COLORS.gris400 } }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
}

/** Escribe una tabla completa (barra + encabezado + filas) a lo ancho de `numCols`. */
function writeTableSection(
  sheet: Sheet,
  startRow: number,
  startCol: number,
  numCols: number,
  title: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  emptyText: string,
  rowFill?: (rowIndex: number) => string | undefined,
  badge?: { text: string; bg: string; color: string },
): number {
  let row = startRow
  writeSectionBar(sheet, row, startCol, numCols, title, badge)
  row += 1
  writeSectionHeader(sheet, row, startCol, headers)
  row += 1
  if (rows.length) {
    rows.forEach((values, index) => {
      writeDataRow(sheet, row, startCol, values, rowFill?.(index))
      row += 1
    })
  } else {
    writeEmptyNotice(sheet, row, startCol, numCols, emptyText)
    row += 1
  }
  return row
}

/**
 * Genera y descarga el "reporte general" de un cliente: banner de perfil,
 * métricas resumen (tarjetas), y el detalle de sus direcciones, vehículos,
 * choferes, cuentas bancarias, préstamos, alquileres, comprobantes y cuentas
 * por cobrar — todo en una sola hoja, con estilo de tarjetas/secciones.
 */
export async function exportarReporteClienteExcel(idCliente: number): Promise<void> {
  const [
    cliente,
    direccionesRes,
    vehiculosRes,
    choferesRes,
    cuentasRes,
    prestamosRes,
    alquileresRes,
    comprobantesRes,
    cuentasCobrarRes,
  ] = await Promise.all([
    clientesService.obtenerPorId(idCliente),
    direccionesService.listar({ idCliente, pagina: 1, limite: 500 }),
    vehiculosService.listar({ idCliente, pagina: 1, limite: 500 }),
    choferesService.listar({ idCliente, pagina: 1, limite: 500 }),
    cuentasBancariasService.listar({ idCliente, pagina: 1, limite: 500 }),
    prestamosAntiguedadService.listar({ idCliente, pagina: 1, limite: 500 }),
    alquileresAntiguedadService.listar({ idCliente, pagina: 1, limite: 500 }),
    comprobantesService.listar({ idCliente, pagina: 1, limite: 500 }),
    finanzasService.listarCuentas('COBRAR', { idTercero: idCliente, pagina: 1, limite: 500 }),
  ])

  if (!cliente) {
    toastInfo('No se encontró el cliente')
    return
  }

  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema Sarita'
  workbook.created = new Date()

  const nombreCliente = getClienteNombrePrincipal(cliente)
  const sheet = workbook.addWorksheet('Reporte', { views: [{ state: 'frozen', ySplit: 2 }] })
  ANCHOS_COLUMNAS.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width
  })

  // ── Banner + perfil del cliente ─────────────────────────────────────────
  writeHeroBanner(sheet, nombreCliente, cliente.estado === 1)
  let row = 3

  const perfilStartRow = row
  writeInfoTile(sheet, row, 1, 2, 'Documento', cliente.numero_documento)
  writeInfoTile(sheet, row, 3, 2, 'Tipo cliente', cliente.nombre_tipo_cliente)
  writeInfoTile(sheet, row, 5, 2, 'Tipo persona', cliente.nombre_tipo_persona)
  writeInfoTile(sheet, row, 7, 2, 'Teléfono', cliente.telefono)
  sheet.getRow(row).height = 30
  row += 1

  writeInfoTile(sheet, row, 1, 2, 'Email', cliente.email)
  writeInfoTile(
    sheet,
    row,
    3,
    6,
    'Ubicación',
    [cliente.nombre_distrito, cliente.nombre_provincia, cliente.nombre_departamento, cliente.nombre_pais]
      .filter(Boolean)
      .join(' / '),
  )
  sheet.getRow(row).height = 30
  row += 1

  writeInfoTile(sheet, row, 1, NUM_COLUMNAS, 'Dirección principal', cliente.direccion)
  sheet.getRow(row).height = 30
  row += 1

  writeCardBorder(sheet, perfilStartRow, 1, row - 1, NUM_COLUMNAS)
  row += 1

  // ── Métricas resumen (tarjetas) ──────────────────────────────────────────
  const prestamosPendientes = prestamosRes.data.filter((p) => p.rango_antiguedad !== 'DEVUELTO')
  const alquileresPendientes = alquileresRes.data.filter((a) => a.rango_antiguedad !== 'DEVUELTO')
  const cuentasVencidas = cuentasCobrarRes.data.filter((c) => c.estado_calculado === 'VENCIDO')
  const totalFacturado = comprobantesRes.data.reduce((acc, c) => acc + (c.total_importe ?? 0), 0)
  const totalSaldoVencido = cuentasVencidas.reduce((acc, c) => acc + c.saldo, 0)

  writeKpiRow(sheet, row, [
    { label: 'Direcciones', value: direccionesRes.meta.total, accent: REPORT_COLORS.gris400 },
    { label: 'Vehículos', value: vehiculosRes.meta.total, accent: REPORT_COLORS.gris400 },
    { label: 'Choferes', value: choferesRes.meta.total, accent: REPORT_COLORS.gris400 },
    { label: 'Cuentas bancarias', value: cuentasRes.meta.total, accent: REPORT_COLORS.gris400 },
  ])
  row += 1
  writeKpiRow(sheet, row, [
    { label: 'Préstamos pend.', value: prestamosPendientes.length, accent: 'FFD97706' },
    { label: 'Alquileres pend.', value: alquileresPendientes.length, accent: 'FFD97706' },
    { label: 'Comprobantes', value: comprobantesRes.meta.total, accent: ACENTO },
    { label: 'Cuentas x cobrar venc.', value: cuentasVencidas.length, accent: REPORT_COLORS.alerta },
  ])
  row += 2

  // ── Direcciones / Vehículos / Choferes / Cuentas bancarias (ancho completo) ──
  row = writeTableSection(
    sheet,
    row,
    1,
    NUM_COLUMNAS,
    `Direcciones — Total: ${direccionesRes.meta.total} registros`,
    ['Dirección', 'Descripción', 'Distrito', 'Provincia', 'Departamento', 'País', 'Principal', 'Estado'],
    direccionesRes.data.map((d) => [
      d.direccion,
      d.descripcion,
      d.nombre_distrito,
      d.nombre_provincia,
      d.nombre_departamento,
      d.nombre_pais,
      siNo(d.es_principal),
      estadoTexto(d.estado),
    ]),
    'Sin direcciones registradas',
  )
  row += 1

  row = writeTableSection(
    sheet,
    row,
    1,
    NUM_COLUMNAS,
    `Vehículos — Total: ${vehiculosRes.meta.total} registros`,
    ['Placa', 'Placa 2', 'Marca', 'Modelo', 'Año', 'Color', 'Tipo de vehículo', 'Estado'],
    vehiculosRes.data.map((v) => [
      v.placa,
      v.placa2,
      v.marca,
      v.modelo,
      v.anio,
      v.color,
      v.nombre_tipo_vehiculo,
      estadoTexto(v.estado),
    ]),
    'Sin vehículos registrados',
  )
  row += 1

  row = writeTableSection(
    sheet,
    row,
    1,
    NUM_COLUMNAS,
    `Choferes — Total: ${choferesRes.meta.total} registros`,
    ['Nombres', 'Tipo doc.', 'N° documento', 'Teléfono', 'Cód. licencia', 'Tipo licencia', 'F. vencimiento', 'Estado'],
    choferesRes.data.map((c) => [
      [c.nombres, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' '),
      c.nombre_tipo_documento,
      c.numero_documento,
      c.telefono,
      c.codigo_licencia,
      c.nombre_tipo_licencia,
      c.fecha_vencimiento?.slice(0, 10),
      estadoTexto(c.estado),
    ]),
    'Sin choferes registrados',
  )
  row += 1

  row = writeTableSection(
    sheet,
    row,
    1,
    NUM_COLUMNAS,
    `Cuentas bancarias — Total: ${cuentasRes.meta.total} registros`,
    ['Banco', 'Tipo de cuenta', 'N° Cuenta', 'CCI', 'Tel. billetera', 'Principal', 'Estado', ''],
    cuentasRes.data.map((cb) => [
      cb.nombre_banco,
      cb.nombre_tipo_cuenta,
      cb.numero_cuenta,
      cb.numero_cuenta_interbancaria,
      cb.telefono_billetera,
      siNo(cb.es_principal),
      estadoTexto(cb.estado),
      '',
    ]),
    'Sin cuentas bancarias registradas',
  )
  row += 1

  row = writeTableSection(
    sheet,
    row,
    1,
    NUM_COLUMNAS,
    `Préstamos — Total: ${prestamosRes.meta.total} registros`,
    ['N° Préstamo', 'Balón / cilindro', 'F. inicio', 'F. vencimiento', 'F. devolución', 'Días', 'Alerta', ''],
    prestamosRes.data.map((p) => [
      p.numero_prestamo,
      [p.codigo_balon, p.nombre_producto_gas].filter(Boolean).join(' — '),
      p.fecha_inicio_prestamo?.slice(0, 10),
      p.fecha_vencimiento?.slice(0, 10),
      p.fecha_devolucion?.slice(0, 10),
      p.dias_en_prestamo,
      RANGO_LABEL[p.rango_antiguedad],
      '',
    ]),
    'Sin préstamos registrados',
    (index) => RANGO_FILL[prestamosRes.data[index]!.rango_antiguedad],
  )
  row += 1

  row = writeTableSection(
    sheet,
    row,
    1,
    NUM_COLUMNAS,
    `Alquileres — Total: ${alquileresRes.meta.total} registros`,
    ['N° Alquiler', 'Balón / cilindro', 'F. inicio', 'F. fin pactada', 'F. devolución', 'Días', 'Alerta', ''],
    alquileresRes.data.map((a) => [
      a.numero_alquiler,
      [a.codigo_balon, a.nombre_producto_gas].filter(Boolean).join(' — '),
      a.fecha_inicio_alquiler?.slice(0, 10),
      a.fecha_fin_pactada?.slice(0, 10),
      a.fecha_devolucion?.slice(0, 10),
      a.dias_en_alquiler,
      RANGO_LABEL[a.rango_antiguedad],
      '',
    ]),
    'Sin alquileres registrados',
    (index) => RANGO_FILL[alquileresRes.data[index]!.rango_antiguedad],
  )
  row += 1

  // ── Comprobantes y Cuentas por cobrar, en tarjetas lado a lado ──────────
  const filasComprobantes = comprobantesRes.data.map((c) => [
    `${c.serie}-${c.numero}`,
    c.fecha?.slice(0, 10),
    formatMoney(c.total_importe),
    [c.nombre_estado, c.nombre_estado_sunat].filter(Boolean).join(' / '),
  ])
  const filasCuentasCobrar = cuentasCobrarRes.data.map((cc) => [
    cc.comprobante || cc.descripcion,
    cc.fecha_vencimiento?.slice(0, 10),
    formatMoney(cc.saldo),
    cc.dias_vencido > 0 ? `${cc.estado_calculado} (${cc.dias_vencido}d)` : cc.estado_calculado,
  ])

  const filasParLado = Math.max(filasComprobantes.length, filasCuentasCobrar.length, 1)
  const rowComprobantesInicio = row

  writeSectionBar(
    sheet,
    row,
    1,
    MITAD,
    `Comprobantes — Total: ${comprobantesRes.meta.total}`,
    { text: `Facturado: ${formatMoney(totalFacturado)}`, bg: REPORT_COLORS.acentoSuave, color: ACENTO },
  )
  writeSectionBar(
    sheet,
    row,
    MITAD + 1,
    MITAD,
    `Cuentas por cobrar — Total: ${cuentasCobrarRes.meta.total}`,
    { text: `Vencido: ${formatMoney(totalSaldoVencido)}`, bg: REPORT_COLORS.alertaSuave, color: REPORT_COLORS.alerta },
  )
  row += 1

  writeSectionHeader(sheet, row, 1, ['Comprobante', 'Fecha', 'Total', 'Estado'])
  writeSectionHeader(sheet, row, MITAD + 1, ['Comprobante', 'F. vencimiento', 'Saldo', 'Estado'])
  row += 1

  for (let i = 0; i < filasParLado; i++) {
    if (filasComprobantes[i]) {
      writeDataRow(sheet, row, 1, filasComprobantes[i]!)
    } else if (i === 0) {
      writeEmptyNotice(sheet, row, 1, MITAD, 'Sin comprobantes emitidos')
    }

    if (filasCuentasCobrar[i]) {
      const esVencido = cuentasCobrarRes.data[i]!.estado_calculado === 'VENCIDO'
      writeDataRow(sheet, row, MITAD + 1, filasCuentasCobrar[i]!, esVencido ? REPORT_COLORS.alertaSuave : undefined)
    } else if (i === 0) {
      writeEmptyNotice(sheet, row, MITAD + 1, MITAD, 'Sin cuentas por cobrar registradas')
    }
    row += 1
  }

  writeCardBorder(sheet, rowComprobantesInicio, 1, row - 1, MITAD)
  writeCardBorder(sheet, rowComprobantesInicio, MITAD + 1, row - 1, NUM_COLUMNAS)

  const fecha = new Date().toISOString().slice(0, 10)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `reporte_${nombreCliente.replace(/\s+/g, '_').toLowerCase()}_${fecha}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
