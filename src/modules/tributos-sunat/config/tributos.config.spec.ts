import { describe, expect, it } from 'vitest'
import { TRIBUTOS_CONFIG } from './tributos.config'

/** Ambos tipos deben cubrir exactamente los mismos campos: la pantalla es una sola. */
describe('TRIBUTOS_CONFIG', () => {
  it('percepción y retención tienen la misma forma y distinto nombre de campos', () => {
    const p = TRIBUTOS_CONFIG.percepcion
    const r = TRIBUTOS_CONFIG.retencion
    expect(Object.keys(p.campos).sort()).toEqual(Object.keys(r.campos).sort())
    expect(p.campos).not.toEqual(r.campos)
    expect(p.seriePrefijo).toBe('P')
    expect(r.seriePrefijo).toBe('R')
    expect(p.paths.lista).toContain('/ventas/')
    expect(r.paths.lista).toContain('/compras/')
    expect(r.soloProveedores).toBe(true)
  })
})
