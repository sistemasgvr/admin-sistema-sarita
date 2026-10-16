import { describe, expect, it } from 'vitest'
import { seriePorDefectoDesdeCodigo } from './serieComprobante'
describe('Series sugeridas de comprobantes y guías', () => {
  it.each([
    ['01', '', 'F002'], ['03', '', 'B002'],
    ['01', 'B001', 'F002'], ['03', 'F001', 'B002'],
    ['01', 'VSD01', 'F002'], ['03', 'VSD01', 'B002'],
    ['01', 'B002', 'F002'], ['03', 'F002', 'B002'],
    ['01', 'B003', 'F003'], ['VSD', 'B002', 'VSD01'],
    ['09', '', 'T002'], ['09', 'T002', 'T002'], ['09', 'T001', 'T001'],
  ])('tipo %s desde %s propone %s', (tipo, actual, expected) => {
    expect(seriePorDefectoDesdeCodigo(tipo, actual)).toBe(expected)
  })
})
