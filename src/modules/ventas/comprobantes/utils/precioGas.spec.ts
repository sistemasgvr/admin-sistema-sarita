import { describe, expect, it } from 'vitest'
import { precioGasDesdeTotal } from './precioGas'

describe('monto directo de gas', () => {
  it.each([[100, 6], [50, 3], [75.5, 10], [20, 0.5], [0, 6]])('conserva el cobro de %s por %s m³', (total, cantidad) => {
    const precio = precioGasDesdeTotal(total, cantidad)
    expect(precio).not.toBeNull()
    expect(Math.round(precio! * cantidad * 100)).toBe(Math.round(total * 100))
  })
  it.each([0, -1, NaN])('rechaza cantidad inválida %s', (cantidad) => {
    expect(precioGasDesdeTotal(100, cantidad)).toBeNull()
  })
})
