import { describe, expect, it } from 'vitest'
import { esRenovacionMismoCilindro, prestamoTieneCilindro } from './renovacionPrestamo'

describe('renovación de préstamo en el POS', () => {
  it('renovar sin elegir cilindro es «mismo cilindro» y no bloquea la venta', () => {
    const linea = { escenarioGas: 'entregar_prestamo' as const, idPrestamoRenovar: 15 }
    expect(esRenovacionMismoCilindro(linea)).toBe(true)
    expect(prestamoTieneCilindro(linea)).toBe(true)
  })

  it('renovar eligiendo otro cilindro es un cambio de cilindro', () => {
    const linea = { escenarioGas: 'entregar_prestamo' as const, idPrestamoRenovar: 15, idBalon: 8 }
    expect(esRenovacionMismoCilindro(linea)).toBe(false)
    expect(prestamoTieneCilindro(linea)).toBe(true)
  })

  it('un préstamo nuevo sigue exigiendo cilindro', () => {
    const linea = { escenarioGas: 'entregar_prestamo' as const }
    expect(esRenovacionMismoCilindro(linea)).toBe(false)
    expect(prestamoTieneCilindro(linea)).toBe(false)
  })

  it('no aplica a otras operaciones de gas', () => {
    expect(esRenovacionMismoCilindro({ escenarioGas: 'balon_cliente', idPrestamoRenovar: 15 })).toBe(false)
  })
})
