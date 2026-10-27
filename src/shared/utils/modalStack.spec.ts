import { describe, expect, it } from 'vitest'
import { crearPilaModales } from './modalStack'

describe('pila de modales', () => {
  it('solo el último abierto es el superior', () => {
    const pila = crearPilaModales()
    const detalle = Symbol('detalle')
    const form = Symbol('form')
    pila.abrir(detalle)
    pila.abrir(form)
    expect(pila.esSuperior(form)).toBe(true)
    expect(pila.esSuperior(detalle)).toBe(false)
    pila.cerrar(form)
    expect(pila.esSuperior(detalle)).toBe(true)
    expect(pila.hayAbiertos()).toBe(true)
    pila.cerrar(detalle)
    expect(pila.hayAbiertos()).toBe(false)
  })

  it('abrir dos veces o cerrar uno ausente no rompe la pila', () => {
    const pila = crearPilaModales()
    const a = Symbol('a')
    pila.abrir(a)
    pila.abrir(a)
    pila.cerrar(Symbol('otro'))
    pila.cerrar(a)
    expect(pila.hayAbiertos()).toBe(false)
  })
})
