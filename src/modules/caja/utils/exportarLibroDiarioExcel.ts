import { downloadExcelWorkbook, REPORT_COLORS } from '@/shared/utils/exportExcel'
import type { LibroDiario } from '@/modules/caja/interfaces/caja.interface'

function money(value: number | null | undefined): number {
  return Number(value ?? 0)
}

function rangoLabel(libro: LibroDiario): string {
  const desde = libro.fechaDesde
  const hasta = libro.fechaHasta || libro.fechaDesde
  return desde === hasta ? desde : `${desde} a ${hasta}`
}

function clienteLabel(libro: LibroDiario): string {
  if (!libro.idCliente) return ''
  const nombre =
    libro.ventas.find((v) => v.idCliente === libro.idCliente)?.cliente ||
    libro.cobranzas.find((c) => c.idCliente === libro.idCliente)?.cliente
  return nombre ? ` · ${nombre}` : ` · Cliente #${libro.idCliente}`
}

export async function exportarLibroDiarioExcel(libro: LibroDiario) {
  const rango = rangoLabel(libro)
  const tituloBase = `Libro diario · ${rango}${clienteLabel(libro)}`
  const t = libro.totales

  await downloadExcelWorkbook({
    filename: `libro-diario-${libro.fechaDesde}${libro.fechaHasta && libro.fechaHasta !== libro.fechaDesde ? `_a_${libro.fechaHasta}` : ''}`,
    sheets: [
      {
        name: 'Resumen',
        title: tituloBase,
        accentColor: REPORT_COLORS.acento,
        columns: [
          { key: 'concepto', header: 'Concepto', width: 28, value: (r) => r.concepto },
          { key: 'monto', header: 'Monto', width: 14, value: (r) => r.monto },
        ],
        rows: [
          { concepto: 'Ventas contado', monto: money(t.ventasContado) },
          { concepto: 'Ventas crédito', monto: money(t.ventasCredito) },
          { concepto: 'Cobranzas', monto: money(t.cobranzas) },
          { concepto: 'Gastos', monto: money(t.gastos) },
          { concepto: 'Depósitos', monto: money(t.depositos) },
        ],
      },
      {
        name: 'Ventas',
        title: `${tituloBase} · Ventas (${libro.ventas.length})`,
        accentColor: REPORT_COLORS.exito,
        columns: [
          { key: 'fecha', header: 'Fecha', width: 12, value: (r) => r.fecha },
          { key: 'comprobante', header: 'Comprobante', width: 16, value: (r) => r.serieNumero },
          { key: 'tipo', header: 'Tipo', width: 14, value: (r) => r.tipoComprobante },
          { key: 'cliente', header: 'Cliente', width: 28, value: (r) => r.cliente },
          { key: 'detalle', header: 'Detalle / m³', width: 36, value: (r) => r.detalleProductos },
          { key: 'medio', header: 'Medio', width: 14, value: (r) => r.medioPago },
          {
            key: 'credito',
            header: 'Crédito',
            width: 10,
            value: (r) => (r.esCredito ? 'Sí' : 'No'),
          },
          { key: 'total', header: 'Total', width: 12, value: (r) => money(r.totalImporte) },
        ],
        rows: libro.ventas,
      },
      {
        name: 'Cobranzas',
        title: `${tituloBase} · Cobranzas (${libro.cobranzas.length})`,
        accentColor: REPORT_COLORS.acento,
        columns: [
          { key: 'fecha', header: 'Fecha', width: 12, value: (r) => r.fechaPago },
          { key: 'cliente', header: 'Cliente', width: 28, value: (r) => r.cliente },
          { key: 'medio', header: 'Medio', width: 14, value: (r) => r.medioPago },
          { key: 'operacion', header: 'Operación', width: 16, value: (r) => r.numeroOperacion },
          { key: 'monto', header: 'Monto', width: 12, value: (r) => money(r.monto) },
          { key: 'obs', header: 'Observación', width: 28, value: (r) => r.observacion },
        ],
        rows: libro.cobranzas,
      },
      {
        name: 'Gastos',
        title: `${tituloBase} · Gastos (${libro.gastos.length})`,
        accentColor: REPORT_COLORS.alerta,
        columns: [
          { key: 'fecha', header: 'Fecha', width: 12, value: (r) => r.fecha },
          { key: 'origen', header: 'Origen', width: 12, value: (r) => r.origen },
          { key: 'concepto', header: 'Concepto', width: 32, value: (r) => r.concepto },
          { key: 'medio', header: 'Medio', width: 14, value: (r) => r.medioPago },
          { key: 'monto', header: 'Monto', width: 12, value: (r) => money(r.monto) },
          { key: 'obs', header: 'Observación', width: 28, value: (r) => r.observacion },
        ],
        rows: libro.gastos,
      },
      {
        name: 'Depósitos',
        title: `${tituloBase} · Depósitos (${libro.depositos.length})`,
        accentColor: 'FFF59E0B',
        columns: [
          { key: 'fecha', header: 'Fecha', width: 12, value: (r) => r.fecha },
          { key: 'cuenta', header: 'Cuenta', width: 22, value: (r) => r.cuentaBancaria },
          { key: 'medio', header: 'Medio', width: 14, value: (r) => r.medioPago },
          { key: 'operacion', header: 'Operación', width: 16, value: (r) => r.numeroOperacion },
          { key: 'monto', header: 'Monto', width: 12, value: (r) => money(r.monto) },
          { key: 'obs', header: 'Observación', width: 28, value: (r) => r.observacion },
        ],
        rows: libro.depositos,
      },
      {
        name: 'Observaciones',
        title: `${tituloBase} · Observaciones (${libro.observaciones.length})`,
        accentColor: REPORT_COLORS.gris500,
        columns: [
          { key: 'fecha', header: 'Fecha', width: 12, value: (r) => r.fecha },
          { key: 'texto', header: 'Observación', width: 50, value: (r) => r.texto },
          { key: 'usuario', header: 'Usuario', width: 18, value: (r) => r.usuario },
        ],
        rows: libro.observaciones,
      },
    ],
  })
}
