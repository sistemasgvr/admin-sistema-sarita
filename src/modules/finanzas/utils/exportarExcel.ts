import ExcelJS from 'exceljs'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type { TipoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'
import { formatListDate } from '@/shared/utils/date'

interface RangoFechas {
  desde?: string
  hasta?: string
}

/** Fuerza descarga del workbook con el nombre indicado. */
async function descargar(workbook: ExcelJS.Workbook, nombreArchivo: string) {
  const buf = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Estiliza el encabezado de una hoja. */
function estilarEncabezado(ws: ExcelJS.Worksheet) {
  const row = ws.getRow(1)
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' },
  }
  row.alignment = { vertical: 'middle', horizontal: 'left' }
  row.height = 22
}

function fechaHoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/* ==================== Cuentas por Cobrar / Pagar ==================== */

export async function exportarCuentasExcel(tipo: TipoCuenta, rango: RangoFechas) {
  // Trae hasta 5000 registros filtrados por fecha (si aplica)
  const { data: cuentas } = await finanzasService.listarCuentas(tipo, {
    pagina: 1,
    limite: 5000,
  })

  // Filtro cliente-side por rango (fecha_emision), si viene
  const filtradas = cuentas.filter((c) => {
    if (!c.fecha_emision) return !rango.desde && !rango.hasta
    if (rango.desde && c.fecha_emision < rango.desde) return false
    if (rango.hasta && c.fecha_emision > rango.hasta) return false
    return true
  })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Sistema Sarita'
  wb.created = new Date()

  const titulo = tipo === 'COBRAR' ? 'Cuentas por Cobrar' : 'Cuentas por Pagar'

  /* Hoja 1: Detalle */
  const detalle = wb.addWorksheet('Detalle')
  detalle.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Tercero', key: 'tercero', width: 34 },
    { header: 'Documento', key: 'documento', width: 14 },
    { header: 'Comprobante', key: 'comprobante', width: 16 },
    { header: 'Descripción', key: 'descripcion', width: 34 },
    { header: 'Emisión', key: 'emision', width: 12 },
    { header: 'Vencimiento', key: 'vencimiento', width: 12 },
    { header: 'Monto', key: 'monto', width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Abonado', key: 'abonado', width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Saldo', key: 'saldo', width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Es plan', key: 'esplan', width: 8 },
    { header: 'Cuotas', key: 'cuotas', width: 8 },
  ]

  filtradas.forEach((c) => {
    detalle.addRow({
      id: c.id,
      tercero: c.tercero,
      documento: c.documento_tercero ?? '',
      comprobante: c.comprobante ?? '',
      descripcion: c.descripcion ?? '',
      emision: c.fecha_emision ?? '',
      vencimiento: c.fecha_vencimiento ?? '',
      monto: Number(c.monto_pendiente ?? 0),
      abonado: Number(c.monto_abonado ?? 0),
      saldo: Number(c.saldo ?? 0),
      estado: c.estado_calculado,
      esplan: c.es_plan ? 'Sí' : 'No',
      cuotas: c.numero_cuotas_total ?? '',
    })
  })
  estilarEncabezado(detalle)
  detalle.autoFilter = { from: 'A1', to: 'M1' }
  detalle.views = [{ state: 'frozen', ySplit: 1 }]

  /* Hoja 2: Totales por tercero */
  const totales = wb.addWorksheet('Totales por tercero')
  totales.columns = [
    { header: 'Tercero', key: 'tercero', width: 40 },
    { header: 'Documento', key: 'documento', width: 14 },
    { header: 'Cuentas', key: 'cantidad', width: 10 },
    { header: 'Monto original', key: 'monto', width: 16, style: { numFmt: '#,##0.00' } },
    { header: 'Abonado', key: 'abonado', width: 16, style: { numFmt: '#,##0.00' } },
    { header: 'Saldo', key: 'saldo', width: 16, style: { numFmt: '#,##0.00' } },
  ]

  const mapa = new Map<string, {
    tercero: string
    documento: string
    cantidad: number
    monto: number
    abonado: number
    saldo: number
  }>()

  for (const c of filtradas) {
    const key = c.documento_tercero || c.tercero
    const acc = mapa.get(key) ?? {
      tercero: c.tercero,
      documento: c.documento_tercero ?? '',
      cantidad: 0,
      monto: 0,
      abonado: 0,
      saldo: 0,
    }
    acc.cantidad += 1
    acc.monto += Number(c.monto_pendiente ?? 0)
    acc.abonado += Number(c.monto_abonado ?? 0)
    acc.saldo += Number(c.saldo ?? 0)
    mapa.set(key, acc)
  }

  const agrupados = Array.from(mapa.values()).sort((a, b) => b.saldo - a.saldo)
  agrupados.forEach((row) => totales.addRow(row))

  // Fila total al final
  const filaTotal = totales.addRow({
    tercero: 'TOTAL',
    documento: '',
    cantidad: agrupados.reduce((s, r) => s + r.cantidad, 0),
    monto: agrupados.reduce((s, r) => s + r.monto, 0),
    abonado: agrupados.reduce((s, r) => s + r.abonado, 0),
    saldo: agrupados.reduce((s, r) => s + r.saldo, 0),
  })
  filaTotal.font = { bold: true }
  filaTotal.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECFDF5' },
  }

  estilarEncabezado(totales)
  totales.views = [{ state: 'frozen', ySplit: 1 }]

  const nombre = `${titulo.replace(/ /g, '-')}_${fechaHoyISO()}.xlsx`
  await descargar(wb, nombre)
  void formatListDate // por si se quiere usar en el futuro para formato humano
}

/* ==================== Garantías ==================== */

export async function exportarGarantiasExcel(rango: RangoFechas) {
  const { data } = await finanzasService.listarGarantias({
    pagina: 1,
    limite: 5000,
    desde: rango.desde,
    hasta: rango.hasta,
  })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Sistema Sarita'
  wb.created = new Date()

  const detalle = wb.addWorksheet('Detalle')
  detalle.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Fecha recepción', key: 'fecha', width: 14 },
    { header: 'Cliente', key: 'cliente', width: 34 },
    { header: 'Documento', key: 'documento', width: 14 },
    { header: 'Método de pago', key: 'medioPago', width: 18 },
    { header: 'Importe', key: 'importe', width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Fecha reembolso', key: 'fechaReembolso', width: 14 },
    { header: 'Método reembolso', key: 'medioReembolso', width: 18 },
    { header: 'Observaciones', key: 'obs', width: 40 },
    { header: 'Obs. reembolso', key: 'obsReembolso', width: 40 },
  ]
  data.forEach((g) => {
    detalle.addRow({
      id: g.id,
      fecha: g.fecha,
      cliente: g.cliente,
      documento: g.documento_cliente ?? '',
      medioPago: g.medio_pago ?? '',
      importe: Number(g.importe),
      estado: g.fecha_reembolso ? 'DEVUELTA' : 'ACTIVA',
      fechaReembolso: g.fecha_reembolso ?? '',
      medioReembolso: g.medio_reembolso ?? '',
      obs: g.observacion ?? '',
      obsReembolso: g.observacion_reembolso ?? '',
    })
  })
  estilarEncabezado(detalle)
  detalle.autoFilter = { from: 'A1', to: 'K1' }
  detalle.views = [{ state: 'frozen', ySplit: 1 }]

  const totales = wb.addWorksheet('Totales por cliente')
  totales.columns = [
    { header: 'Cliente', key: 'cliente', width: 40 },
    { header: 'Documento', key: 'documento', width: 14 },
    { header: 'Garantías', key: 'cantidad', width: 12 },
    { header: 'Activas', key: 'activas', width: 10 },
    { header: 'Devueltas', key: 'devueltas', width: 10 },
    { header: 'Importe total', key: 'importe', width: 16, style: { numFmt: '#,##0.00' } },
    { header: 'Saldo activo', key: 'saldo', width: 16, style: { numFmt: '#,##0.00' } },
  ]
  const mapa = new Map<
    string,
    { cliente: string; documento: string; cantidad: number; activas: number; devueltas: number; importe: number; saldo: number }
  >()
  for (const g of data) {
    const key = g.documento_cliente || g.cliente
    const acc = mapa.get(key) ?? {
      cliente: g.cliente,
      documento: g.documento_cliente ?? '',
      cantidad: 0, activas: 0, devueltas: 0, importe: 0, saldo: 0,
    }
    acc.cantidad += 1
    acc.importe += Number(g.importe)
    if (g.fecha_reembolso) {
      acc.devueltas += 1
    } else {
      acc.activas += 1
      acc.saldo += Number(g.importe)
    }
    mapa.set(key, acc)
  }
  Array.from(mapa.values())
    .sort((a, b) => b.saldo - a.saldo)
    .forEach((r) => totales.addRow(r))

  const filaTotal = totales.addRow({
    cliente: 'TOTAL',
    documento: '',
    cantidad: data.length,
    activas: data.filter((g) => !g.fecha_reembolso).length,
    devueltas: data.filter((g) => !!g.fecha_reembolso).length,
    importe: data.reduce((s, g) => s + Number(g.importe), 0),
    saldo: data.filter((g) => !g.fecha_reembolso).reduce((s, g) => s + Number(g.importe), 0),
  })
  filaTotal.font = { bold: true }
  filaTotal.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECFDF5' },
  }
  estilarEncabezado(totales)
  totales.views = [{ state: 'frozen', ySplit: 1 }]

  await descargar(wb, `Garantias_${fechaHoyISO()}.xlsx`)
}
