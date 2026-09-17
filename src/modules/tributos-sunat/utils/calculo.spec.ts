import { describe, expect, it } from 'vitest'
import { calcularResumen, hoyLima, validarFormularioTributo } from './calculo'

const HOY = hoyLima()

describe('calcularResumen', () => {
  it('suma percepción al cobro y redondea por línea a centavos', () => {
    expect(calcularResumen('percepcion', [1180, 33.33], 0.5)).toEqual({ base: 1213.33, tributo: 6.07, neto: 1219.4 })
  })

  it('descuenta la retención del pago', () => {
    expect(calcularResumen('retencion', [1180], 3)).toEqual({ base: 1180, tributo: 35.4, neto: 1144.6 })
  })

  it('sin orígenes o sin tasa devuelve ceros', () => {
    expect(calcularResumen('percepcion', [], 2)).toEqual({ base: 0, tributo: 0, neto: 0 })
    expect(calcularResumen('percepcion', [100], 0)).toEqual({ base: 100, tributo: 0, neto: 100 })
  })
})

describe('validarFormularioTributo', () => {
  const base = {
    idEmpresa: 18,
    serie: 'P001',
    fechaEmision: HOY,
    regimen: '01',
    tasa: 2,
    origenes: [{ fecha: '2026-09-10', fechaOperacion: HOY }],
  }

  it('acepta un formulario completo', () => {
    expect(validarFormularioTributo('percepcion', base)).toBeNull()
    expect(validarFormularioTributo('retencion', { ...base, serie: 'R001' })).toBeNull()
  })

  it.each([
    [{ idEmpresa: null }, 'empresa emisora'],
    [{ origenes: [] }, 'al menos un comprobante'],
    [{ serie: 'R001' }, 'P001–P999'],
    [{ fechaEmision: '2099-01-01' }, 'no puede ser futura'],
    [{ regimen: '' }, 'régimen'],
    [{ tasa: 0 }, 'tasa'],
    [{ origenes: [{ fecha: '2026-09-10', fechaOperacion: '2026-09-01' }] }, 'anterior a la emisión del comprobante'],
    [{ origenes: [{ fecha: '2026-09-10', fechaOperacion: '2099-01-01' }] }, 'posterior a la emisión'],
  ] as [Partial<typeof base>, string][])('detecta %j', (overrides, mensaje) => {
    expect(validarFormularioTributo('percepcion', { ...base, ...overrides })).toContain(mensaje)
  })

  it('la retención usa serie R y habla de compras', () => {
    expect(validarFormularioTributo('retencion', { ...base, serie: 'P001' })).toContain('R001–R999')
    expect(validarFormularioTributo('retencion', { ...base, serie: 'R001', origenes: [] })).toContain('compra')
  })
})
