import { describe, expect, it } from 'vitest'
import {
  PORCENTAJE_IGV_DEFAULT,
  etiquetaIgv,
  parsePorcentajeIgv,
  tasaIgvDesdePorcentaje,
} from './porcentajeIgv'

describe('parsePorcentajeIgv', () => {
  it('usa 18 por defecto cuando está vacío', () => {
    expect(PORCENTAJE_IGV_DEFAULT).toBe(18)
    expect(parsePorcentajeIgv('')).toEqual({ ok: true, valor: 18 })
    expect(parsePorcentajeIgv(null)).toEqual({ ok: true, valor: 18 })
    expect(parsePorcentajeIgv(undefined)).toEqual({ ok: true, valor: 18 })
    expect(parsePorcentajeIgv('   ')).toEqual({ ok: true, valor: 18 })
  })

  it('acepta 0, 100 y decimales (string o número)', () => {
    expect(parsePorcentajeIgv(0)).toEqual({ ok: true, valor: 0 })
    expect(parsePorcentajeIgv('0')).toEqual({ ok: true, valor: 0 })
    expect(parsePorcentajeIgv(100)).toEqual({ ok: true, valor: 100 })
    expect(parsePorcentajeIgv('10.5')).toEqual({ ok: true, valor: 10.5 })
    expect(parsePorcentajeIgv('10,5')).toEqual({ ok: true, valor: 10.5 })
  })

  it('redondea a 2 decimales', () => {
    expect(parsePorcentajeIgv('18.126')).toEqual({ ok: true, valor: 18.13 })
    expect(parsePorcentajeIgv(8.004)).toEqual({ ok: true, valor: 8 })
  })

  it('rechaza valores fuera de 0..100 o no numéricos', () => {
    expect(parsePorcentajeIgv(-1).ok).toBe(false)
    expect(parsePorcentajeIgv('-0.01').ok).toBe(false)
    expect(parsePorcentajeIgv(100.01).ok).toBe(false)
    expect(parsePorcentajeIgv('abc').ok).toBe(false)
    expect(parsePorcentajeIgv(Number.NaN).ok).toBe(false)
    const r = parsePorcentajeIgv(150)
    expect(r.ok ? '' : r.error).toMatch(/0 y 100/)
  })
})

describe('tasaIgvDesdePorcentaje / etiquetaIgv', () => {
  it('convierte el porcentaje a tasa', () => {
    expect(tasaIgvDesdePorcentaje(18)).toBeCloseTo(0.18)
    expect(tasaIgvDesdePorcentaje(10.5)).toBeCloseTo(0.105)
    expect(tasaIgvDesdePorcentaje(0)).toBe(0)
  })

  it('arma la etiqueta sin ceros sobrantes', () => {
    expect(etiquetaIgv(18)).toBe('IGV (18%)')
    expect(etiquetaIgv(10.5)).toBe('IGV (10.5%)')
    expect(etiquetaIgv(0)).toBe('IGV (0%)')
    expect(etiquetaIgv(null)).toBe('IGV (18%)')
    expect(etiquetaIgv('12.25')).toBe('IGV (12.25%)')
  })
})
