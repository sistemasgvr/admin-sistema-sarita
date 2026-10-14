import { describe, expect, it } from 'vitest'
import {
  esMontoMonedaValido,
  mensajeErrorMontoMoneda,
  bloquearPegadoMontoInvalido,
  formatPrecioUnitario,
  precioUnitarioDesdeImporte,
  roundPrecioUnitario,
  roundToDecimales,
} from './currency'

/**
 * Reproduce lo que hace Postgres en com_comprobante_compra_detalle:
 * `importe = cantidad * precio_unitario`, con precio_unitario en numeric(12,6)
 * y el resultado almacenado en numeric(12,4).
 */
function importeEnBaseDeDato(cantidad: number, precioUnitario: number): number {
  return Number((cantidad * roundToDecimales(precioUnitario, 6)).toFixed(4))
}

describe('roundToDecimales', () => {
  it('redondea a la precisión pedida', () => {
    expect(roundToDecimales(33.3333333333, 6)).toBe(33.333333)
    expect(roundToDecimales(1.005, 2)).toBe(1.01)
  })

  it('normaliza entradas no numéricas a 0', () => {
    expect(roundToDecimales(undefined)).toBe(0)
    expect(roundToDecimales(NaN)).toBe(0)
  })
})

describe('precioUnitarioDesdeImporte', () => {
  it.each([
    [100, 10],
    [100, 3],
    [100, 1.01],
    [1, 0.07],
    [33.33, 2.5],
    [1000, 7],
    [0.01, 3],
  ])('deriva un P. unitario que reconstruye el importe %s / %s', (importe, cantidad) => {
    const precio = precioUnitarioDesdeImporte(importe, cantidad)

    expect(precio).not.toBeNull()
    expect(importeEnBaseDeDato(cantidad, precio!)).toBe(importe)
  })

  it('acepta el importe y la cantidad como texto', () => {
    expect(precioUnitarioDesdeImporte('100.00', '3')).toBe(33.333333)
  })

  it.each([0, -1, NaN])('rechaza cantidad inválida %s', (cantidad) => {
    expect(precioUnitarioDesdeImporte(100, cantidad)).toBeNull()
  })

  it('devuelve null sin importe numérico', () => {
    expect(precioUnitarioDesdeImporte(null, 5)).toBe(0)
    expect(precioUnitarioDesdeImporte('abc', 5)).toBeNull()
  })
})

describe('roundPrecioUnitario', () => {
  it('conserva los 6 decimales que admite el P. unitario', () => {
    expect(roundPrecioUnitario(33.333333)).toBe(33.333333)
    expect(roundPrecioUnitario(33.3333333)).toBe(33.333333)
    expect(roundPrecioUnitario(33.3333338)).toBe(33.333334)
  })
})

describe('formatPrecioUnitario', () => {
  it('no oculta los decimales del P. unitario derivado', () => {
    // Con Intl currency a secas un 33.333333 se vería como S/ 33.33 y el
    // usuario pensaría que el importe de la línea no cuadra.
    expect(formatPrecioUnitario(33.333333)).toContain('33.3333')
  })

  it('no inventa decimales en un P. unitario redondo', () => {
    expect(formatPrecioUnitario(10)).toBe(formatPrecioUnitario(10))
    expect(formatPrecioUnitario(10)).not.toContain('.')
  })
})

describe('precisión configurable del precio', () => {
  it('admite seis decimales sin cambiar los dos decimales por defecto', () => {
    expect(esMontoMonedaValido('5.123456', { maxDecimals: 6 })).toBe(true)
    expect(mensajeErrorMontoMoneda('5.123456', { maxDecimals: 6 })).toBeNull()
    expect(esMontoMonedaValido('5.123456')).toBe(false)
    expect(esMontoMonedaValido('5.1234567', { maxDecimals: 6 })).toBe(false)
    expect(mensajeErrorMontoMoneda('5.1234567', { maxDecimals: 6 })).toContain('6 decimales')
  })

  it('valida el resultado completo al pegar sobre una selección', () => {
    let blocked = false
    const event = {
      clipboardData: { getData: () => '123456' },
      target: { value: '5.1', selectionStart: 3, selectionEnd: 3 },
      preventDefault: () => { blocked = true },
    } as unknown as ClipboardEvent
    bloquearPegadoMontoInvalido(event, 6)
    expect(blocked).toBe(true)
    blocked = false
    Object.assign(event.target!, { selectionStart: 2, selectionEnd: 3 })
    bloquearPegadoMontoInvalido(event, 6)
    expect(blocked).toBe(false)
  })
})
