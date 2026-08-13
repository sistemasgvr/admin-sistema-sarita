export type CuotaPreviewItem = {
  numero: number
  fechaPago: string
  monto: number
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function addDaysIso(iso: string, days: number) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return ''
  const date = new Date(y, m - 1, d + days)
  return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/** Primera cuota: igual criterio que `com_generar_cxp_compra`. */
export function fechaPrimeraCuota(
  fechaCompra: string,
  diasCredito: number,
  diaMesPago: number,
): string {
  const fecha = fechaCompra.slice(0, 10)
  if (!fecha) return ''
  if (diasCredito > 0) return addDaysIso(fecha, diasCredito)
  if (!Number.isFinite(diaMesPago) || diaMesPago < 1) return ''

  const [y, m, d] = fecha.split('-').map(Number)
  const dayThisMonth = Math.min(diaMesPago, lastDayOfMonth(y, m))
  if (dayThisMonth >= d) return isoDate(y, m, dayThisMonth)

  const nextMonth = m === 12 ? 1 : m + 1
  const nextYear = m === 12 ? y + 1 : y
  return isoDate(nextYear, nextMonth, Math.min(diaMesPago, lastDayOfMonth(nextYear, nextMonth)))
}

export function fechaVencimientoCredito(fechaCompra: string, diasCredito: number) {
  if (!fechaCompra || diasCredito <= 0) return ''
  return addDaysIso(fechaCompra.slice(0, 10), diasCredito)
}

export function fechasCuotasMensuales(
  primera: string,
  numeroCuotas: number,
  diaMesPago: number,
): string[] {
  if (!primera || numeroCuotas < 1) return []
  const dates = [primera.slice(0, 10)]
  let [y, m] = primera.slice(0, 10).split('-').map(Number)
  for (let i = 1; i < numeroCuotas; i++) {
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
    dates.push(isoDate(y, m, Math.min(diaMesPago || 1, lastDayOfMonth(y, m))))
  }
  return dates
}

export function redistribuirMontos(cuotas: CuotaPreviewItem[], total: number): CuotaPreviewItem[] {
  const n = cuotas.length
  if (n < 1) return cuotas
  const t = Math.max(0, Number(total) || 0)
  const cuota = Math.round((t / n) * 100) / 100
  const acumulado = cuota * (n - 1)
  return cuotas.map((item, index) => ({
    ...item,
    monto: index === n - 1 ? Math.round((t - acumulado) * 100) / 100 : cuota,
  }))
}

export function aplicarPrimeraCuota(
  cuotas: CuotaPreviewItem[],
  primera: string,
  diaMesPago: number,
): CuotaPreviewItem[] {
  if (!primera || cuotas.length < 1) return cuotas
  const dia = diaMesPago || Number(primera.slice(8, 10)) || 1
  const fechas = fechasCuotasMensuales(primera, cuotas.length, dia)
  return cuotas.map((item, index) => ({
    ...item,
    fechaPago: fechas[index] ?? item.fechaPago,
  }))
}

export function previewCuotasCompra(params: {
  total: number
  numeroCuotas: number
  fechaCompra: string
  diasCredito: number
  diaMesPago: number
}): CuotaPreviewItem[] {
  const n = Math.trunc(params.numeroCuotas)
  if (n < 2) return []

  const primera = fechaPrimeraCuota(params.fechaCompra, params.diasCredito, params.diaMesPago)
  if (!primera) return []

  const fechas = fechasCuotasMensuales(
    primera,
    n,
    params.diaMesPago || Number(primera.slice(8, 10)),
  )
  return redistribuirMontos(
    fechas.map((fechaPago, index) => ({
      numero: index + 1,
      fechaPago,
      monto: 0,
    })),
    params.total,
  )
}
