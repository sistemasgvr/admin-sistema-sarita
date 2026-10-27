import { describe, expect, it, vi } from 'vitest'
import {
  medioPrincipal,
  nuevaLineaPago,
  saldoPendiente,
  validarPagos,
  vuelto,
  type LineaPagoForm,
} from './pagosMixtos'

const EF = new Set([1]) // 1 = EFECTIVO, 2 = YAPE
const l = (idMedioPago: number | null, monto: number, extra: Partial<LineaPagoForm> = {}): LineaPagoForm => ({
  ...nuevaLineaPago(monto),
  idMedioPago,
  ...extra,
})

describe('pagos mixtos', () => {
  it('saldo pendiente', () => {
    expect(saldoPendiente(150, [l(1, 100)])).toBe(50)
    expect(saldoPendiente(100, [l(1, 33.33), l(2, 33.33), l(1, 33.34)])).toBe(0)
  })
  it('vuelto solo sobre el efectivo', () => {
    expect(vuelto(200, [l(1, 100), l(2, 50)], EF)).toBe(100)
    expect(vuelto(null, [l(1, 100)], EF)).toBeNull()
    expect(vuelto(50, [l(2, 50)], EF)).toBeNull() // sin línea en efectivo
  })
  it('vuelto suma la garantía cobrada en efectivo', () => {
    expect(vuelto(200, [l(1, 50)], EF, 100)).toBe(50)
    expect(vuelto(150, [l(2, 50)], EF, 100)).toBe(50) // venta con Yape, garantía en efectivo
    expect(vuelto(200, [l(1, 50)], EF, 0)).toBe(150)
  })
  it('valida el efectivo recibido contra venta + garantía en efectivo', () => {
    expect(validarPagos(50, [l(1, 50)], 120, EF, 100)).toBe('El efectivo recibido no alcanza para el monto en efectivo')
    expect(validarPagos(50, [l(1, 50)], 150, EF, 100)).toBeNull()
    expect(validarPagos(50, [l(2, 50)], 80, EF, 100)).toBe('El efectivo recibido no alcanza para el monto en efectivo')
  })
  it('valida', () => {
    expect(validarPagos(150, [l(1, 100), l(2, 50)], null, EF)).toBeNull()
    expect(validarPagos(150, [], null, EF)).toBe('Agrega al menos un medio de pago')
    expect(validarPagos(150, [l(null, 150)], null, EF)).toBe('Selecciona el medio de pago de cada línea')
    expect(validarPagos(150, [l(1, 150), l(2, 0)], null, EF)).toBe('Cada monto debe ser mayor a 0')
    expect(validarPagos(150, [l(1, 75), l(1, 75)], null, EF)).toBe('No repitas el mismo medio y cuenta en dos líneas')
    expect(validarPagos(150, [l(1, 100), l(2, 40)], null, EF)).toBe('Los pagos suman S/ 140.00 y el total es S/ 150.00')
    expect(validarPagos(160, [l(1, 100), l(2, 50)], null, EF)).toBe('Los pagos suman S/ 150.00 y el total es S/ 160.00')
    expect(validarPagos(100, [l(1, 33.33), l(2, 33.33), l(1, 33.34, { idCuentaBancaria: 9 })], null, EF)).toBeNull()
    expect(validarPagos(150, [l(1, 100), l(2, 50)], 80, EF)).toBe('El efectivo recibido no alcanza para el monto en efectivo')
    expect(validarPagos(150, [l(2, 150, { valido: false })], null, EF)).toBe('Completa la cuenta bancaria y el número de operación del cobro')
  })
  it('genera keys únicas aunque no exista crypto.randomUUID (HTTP en LAN)', () => {
    vi.stubGlobal('crypto', {})
    try {
      const a = nuevaLineaPago(0).key
      const b = nuevaLineaPago(0).key
      expect(a).toMatch(/^linea-\d+$/)
      expect(a).not.toBe(b)
    } finally {
      vi.unstubAllGlobals()
    }
  })
  it('medio principal = mayor monto', () => {
    expect(medioPrincipal([l(2, 50), l(1, 100)])).toBe(1)
    expect(medioPrincipal([])).toBeNull()
  })
})
