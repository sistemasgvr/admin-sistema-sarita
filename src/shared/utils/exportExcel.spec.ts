import ExcelJS from 'exceljs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadExcel } from './exportExcel'
import { columnasListadoExcel } from './exportarListadoExcel'

/** Genera el libro real y lo vuelve a abrir, para validar lo que recibe Excel. */
async function generarHoja<T>(rows: T[], columns: ReturnType<typeof columnasListadoExcel<T>>) {
  let contenido: ArrayBuffer | undefined
  vi.stubGlobal(
    'Blob',
    class {
      constructor(partes: ArrayBuffer[]) {
        contenido = partes[0]
      }
    },
  )
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: () => undefined })
  vi.stubGlobal('document', { createElement: () => ({ click: () => undefined }) })

  await downloadExcel({ filename: 'prueba', rows, columns })

  const libro = new ExcelJS.Workbook()
  await libro.xlsx.load(contenido!)
  return libro.worksheets[0]!
}

describe('downloadExcel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('escribe fecha real e importe numérico con su formato de celda', async () => {
    const row = { fecha: '2026-11-04T09:08:00', total: '1250.5', vacio: null as number | null }
    const hoja = await generarHoja(
      [row],
      columnasListadoExcel<typeof row>([
        ['fecha', 'Fecha', 'fechaHora'],
        ['total', 'Total', 'importe'],
        ['vacio', 'Línea', 'importe'],
      ]),
    )

    const fecha = hoja.getCell('A2')
    expect(fecha.value).toBeInstanceOf(Date)
    expect((fecha.value as Date).toISOString()).toBe('2026-11-04T09:08:00.000Z')
    expect(fecha.numFmt).toBe('dd/mm/yyyy hh:mm')
    expect(fecha.font?.name).toBe('Segoe UI')

    expect(hoja.getCell('B2').value).toBe(1250.5)
    expect(hoja.getCell('B2').numFmt).toBe('#,##0.00')
    expect(hoja.getCell('C2').value).toBeFalsy()
  })
})
