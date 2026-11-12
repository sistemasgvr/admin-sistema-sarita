import { describe, expect, it } from 'vitest'
import { payloadComprobanteEdicion } from './payloadComprobanteEdicion'

const original = {
  fecha: '2026-11-10',
  fecha_emision: '2026-11-09',
  id_tipo_comprobante: 3,
  serie: 'F001',
  numero: '12',
}
const sinCambios = {
  fecha: '2026-11-10',
  fechaEmision: '2026-11-09',
  idTipoComprobante: 3,
  serie: 'F001',
  numero: '12',
}

describe('payloadComprobanteEdicion', () => {
  it('sin cambios no envía nada (se conserva todo)', () => {
    expect(payloadComprobanteEdicion(sinCambios, original)).toEqual({})
  })

  it('envía solo lo que cambió', () => {
    expect(
      payloadComprobanteEdicion(
        { ...sinCambios, fecha: '2026-11-11', fechaEmision: '2026-11-08', idTipoComprobante: '4' },
        original,
      ),
    ).toEqual({ fecha: '2026-11-11', fechaEmision: '2026-11-08', idTipoComprobante: 4 })
  })

  it('vaciar fecha de emisión y tipo envía null', () => {
    expect(
      payloadComprobanteEdicion({ ...sinCambios, fechaEmision: '', idTipoComprobante: '' }, original),
    ).toEqual({ fechaEmision: null, idTipoComprobante: null })
  })

  it("vaciar serie y número envía '' (espacios cuentan como vacío)", () => {
    expect(payloadComprobanteEdicion({ ...sinCambios, serie: '  ', numero: '' }, original)).toEqual({
      serie: '',
      numero: '',
    })
  })

  it('campos vacíos que ya estaban vacíos no se envían', () => {
    const vacio = { fecha: '2026-11-10', fecha_emision: null, id_tipo_comprobante: null, serie: null, numero: null }
    expect(
      payloadComprobanteEdicion(
        { fecha: '2026-11-10', fechaEmision: '', idTipoComprobante: '', serie: '', numero: '' },
        vacio,
      ),
    ).toEqual({})
  })
})
