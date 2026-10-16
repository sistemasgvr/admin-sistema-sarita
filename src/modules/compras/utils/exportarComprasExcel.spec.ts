import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Compra } from '@/modules/compras/interfaces/compra.interface'
vi.mock('@/modules/compras/services/compras.service', () => ({
  comprasService: { listar: vi.fn(), obtenerPorId: vi.fn() },
}))
vi.mock('@/shared/composables/useToast', () => ({ toastInfo: vi.fn() }))
vi.mock('@/shared/utils/exportExcel', () => ({
  fetchAllPages: vi.fn(),
  downloadExcelWorkbook: vi.fn(),
}))
import { crearHojasCompras, exportarComprasExcel } from './exportarComprasExcel'
import { comprasService } from '@/modules/compras/services/compras.service'
import { downloadExcelWorkbook, fetchAllPages } from '@/shared/utils/exportExcel'

const compra = {
  cabecera: {
    id: 17,
    serie: 'F001',
    numero: '000042',
    proveedor_documento: '00123456789',
    proveedor: 'Proveedor',
    moneda: 'SOLES',
    total_importe: 118,
    sub_total: 100,
    igv: 18,
    estado: 0,
    glosa: 'Oxígeno',
    declarar_sunat: true,
  },
  detalle: [
    {
      id: 8,
      item: 1,
      codigo_producto: '0001',
      cantidad: 2.5,
      precio_unitario: 40,
      importe: 100,
      afecta_stock: false,
      estado: 1,
    },
  ],
  cuenta_por_pagar: {
    id: 9,
    monto_pendiente: 118,
    monto_abonado: 30,
    saldo: 88,
    cuotas: [{ id: 10, numero_cuota: 1, monto_pendiente: 118, monto_abonado: 30, saldo: 88 }],
  },
} as Compra

describe('Excel de compras', () => {
  beforeEach(() => vi.clearAllMocks())
  it('separa relaciones sin duplicar totales y conserva códigos, decimales y banderas', () => {
    const sheets = crearHojasCompras([compra])
    const values = (index: number) => {
      const sheet = sheets[index]!
      // Cada hoja tiene su propio tipo; evaluamos sus columnas como el generador del libro.
      return Object.fromEntries(
        sheet.columns.map((c) => [c.key, (c.value as (r: unknown) => unknown)(sheet.rows[0])]),
      )
    }
    expect(sheets.map((s) => s.name)).toEqual(['Compras', 'Detalle', 'Cuentas por pagar', 'Cuotas'])
    expect(values(0)).toMatchObject({
      numero: '000042',
      proveedor_documento: '00123456789',
      total_importe: 118,
      igv: 18,
      estado: 'Anulado',
      declarar_sunat: 'Sí',
      tiene_comprobante: 'Sí',
    })
    expect(values(1)).toMatchObject({
      id_compra: 17,
      id: 8,
      codigo_producto: '0001',
      cantidad: 2.5,
      afecta_stock: 'No',
    })
    expect(values(2)).toMatchObject({ id_compra: 17, id: 9, saldo: 88 })
    expect(values(3)).toMatchObject({ id_compra: 17, id_cuenta: 9, id: 10, saldo: 88 })
  })
  it('admite compras sin comprobante, líneas ni financiación sin inventar cuentas', () => {
    const sheets = crearHojasCompras([
      {
        ...compra,
        cabecera: { ...compra.cabecera, serie: ' ' },
        detalle: [],
        cuenta_por_pagar: null,
      },
    ])
    expect(sheets.slice(1).every((s) => s.rows.length === 0)).toBe(true)
    const header = sheets[0]!
    expect(header.columns.find((c) => c.key === 'tiene_comprobante')!.value(header.rows[0]!)).toBe(
      'No',
    )
  })
  it('respeta filtros y consulta el detalle de todas las compras antes de descargar', async () => {
    vi.mocked(fetchAllPages).mockResolvedValue([{ id: 17 }, { id: 18 }])
    vi.mocked(comprasService.obtenerPorId).mockResolvedValue(compra)
    const filters = { fechaDesde: '2026-10-01', estado: 0, sinComprobante: true }
    await exportarComprasExcel(filters)
    expect(fetchAllPages).toHaveBeenCalledWith(comprasService.listar, filters)
    expect(comprasService.obtenerPorId).toHaveBeenCalledWith(17)
    expect(comprasService.obtenerPorId).toHaveBeenCalledWith(18)
    expect(downloadExcelWorkbook).toHaveBeenCalledOnce()
  })
  it('no descarga un reporte parcial si falla una consulta', async () => {
    vi.mocked(fetchAllPages).mockResolvedValue([{ id: 17 }])
    vi.mocked(comprasService.obtenerPorId).mockRejectedValue(new Error('Sin conexión'))
    await expect(exportarComprasExcel({})).rejects.toThrow('Sin conexión')
    expect(downloadExcelWorkbook).not.toHaveBeenCalled()
  })
  it('no consulta detalles ni descarga si el filtro no arroja resultados', async () => {
    vi.mocked(fetchAllPages).mockResolvedValue([])
    await exportarComprasExcel({})
    expect(comprasService.obtenerPorId).not.toHaveBeenCalled()
    expect(downloadExcelWorkbook).not.toHaveBeenCalled()
  })
})
