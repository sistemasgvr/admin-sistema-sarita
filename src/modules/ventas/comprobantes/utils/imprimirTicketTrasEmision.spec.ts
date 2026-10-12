import {describe,expect,it} from 'vitest'
import {debeImprimirTrasEmision} from './imprimirTicketTrasEmision'

describe('impresión automática después de la emisión',()=>{
  it('imprime únicamente cuando existe aceptación confirmada',()=>{
    expect(debeImprimirTrasEmision('ACEPTADO')).toBe(true)
    for(const estado of ['PENDIENTE','ERROR_ENVIO','RECHAZADO','SIN_CONFIRMACION','']) {
      expect(debeImprimirTrasEmision(estado)).toBe(false)
    }
  })
})
