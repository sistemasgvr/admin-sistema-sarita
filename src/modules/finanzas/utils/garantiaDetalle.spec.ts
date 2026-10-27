import { describe, expect, it } from 'vitest'
import type { Garantia } from '@/modules/finanzas/interfaces/garantia.interface'
import {
  avisoGarantiaLigada,
  cambiosGarantiaEdicion,
  estadoColor,
  formatCuentaMovimiento,
  origenDetalle,
  resolveOrigen,
  valoresEdicionGarantia,
} from './garantiaDetalle'

const base = {
  id: 1,
  id_cliente: 2,
  fecha_registro: '2026-10-20',
  monto_cobrado: 50,
  monto_devuelto: 0,
  monto_saldo: 50,
  estado: 1,
} as Garantia

describe('resolveOrigen', () => {
  it('usa el origen calculado por la API', () => {
    expect(resolveOrigen({ ...base, origen: 'ALQUILER', id_prestamo: 3 })).toBe('ALQUILER')
  })
  it('deduce el origen sin campo origen', () => {
    expect(resolveOrigen({ ...base, id_prestamo: 3 })).toBe('PRESTAMO')
    expect(resolveOrigen({ ...base, comprobante_cobro: 'B001-5' })).toBe('POS')
    expect(resolveOrigen(base)).toBe('MANUAL')
  })
})

describe('origenDetalle', () => {
  it('muestra la referencia del documento', () => {
    expect(origenDetalle({ ...base, numero_prestamo: 'PR-0007' })).toBe('Préstamo PR-0007')
    expect(origenDetalle({ ...base, comprobante_cobro: 'B001-5' })).toBe('Comprobante B001-5')
    expect(origenDetalle(base)).toBe('Sin vínculo operativo')
  })
})

describe('avisoGarantiaLigada', () => {
  it('avisa cuando la garantía viene de un préstamo', () => {
    expect(avisoGarantiaLigada({ ...base, origen: 'PRESTAMO', numero_prestamo: 'PR-0007' })).toBe(
      'Garantía ligada a préstamo PR-0007: los cambios de monto, fecha o cliente pueden no coincidir con ese documento',
    )
  })
  it('avisa para alquiler y POS con su referencia', () => {
    expect(avisoGarantiaLigada({ ...base, origen: 'ALQUILER', numero_alquiler: 'AL-3' })).toContain(
      'alquiler AL-3',
    )
    expect(avisoGarantiaLigada({ ...base, origen: 'POS', comprobante_cobro: 'B001-5' })).toContain(
      'comprobante B001-5',
    )
  })
  it('usa el id cuando falta el número', () => {
    expect(avisoGarantiaLigada({ ...base, origen: 'PRESTAMO', id_prestamo: 9 })).toContain(
      'préstamo #9',
    )
  })
  it('no avisa para garantías manuales o sin garantía', () => {
    expect(avisoGarantiaLigada({ ...base, origen: 'MANUAL' })).toBeNull()
    expect(avisoGarantiaLigada(null)).toBeNull()
  })
})

describe('formatCuentaMovimiento', () => {
  it('une cuenta y nº de operación', () => {
    expect(formatCuentaMovimiento({ cuenta_bancaria: 'BCP Soles', numero_operacion: 'OP-1' })).toBe(
      'BCP Soles · Op. OP-1',
    )
  })
  it('muestra solo lo que existe o un guion', () => {
    expect(formatCuentaMovimiento({ cuenta_bancaria: 'BCP Soles' })).toBe('BCP Soles')
    expect(formatCuentaMovimiento({ numero_operacion: ' OP-2 ' })).toBe('Op. OP-2')
    expect(formatCuentaMovimiento({ cuenta_bancaria: ' ', numero_operacion: null })).toBe('—')
  })
})

describe('estadoColor', () => {
  it('distingue TRANSFERIDA', () => {
    expect(estadoColor('TRANSFERIDA')).toBe('neutral')
    expect(estadoColor('DEVUELTA')).toBe('success')
  })
})

describe('valoresEdicionGarantia', () => {
  it('toma los valores efectivos del cobro antes que los de cabecera', () => {
    expect(
      valoresEdicionGarantia({
        ...base,
        id_medio_pago: null,
        id_cuenta_bancaria: null,
        cobro_fecha: '2026-10-18',
        cobro_id_medio_pago: 7,
        cobro_id_cuenta_bancaria: 4,
        numero_operacion: 'OP-9',
        observacion: 'nota',
      }),
    ).toEqual({
      fecha: '2026-10-18',
      idCliente: 2,
      idMedioPago: 7,
      idCuentaBancaria: 4,
      numeroOperacion: 'OP-9',
      importe: 50,
      observacion: 'nota',
    })
  })
  it('usa la cabecera cuando no hay datos del cobro', () => {
    const v = valoresEdicionGarantia({ ...base, id_medio_pago: 1, id_cuenta_bancaria: null })
    expect(v.fecha).toBe('2026-10-20')
    expect(v.idMedioPago).toBe(1)
    expect(v.idCuentaBancaria).toBeNull()
    expect(v.numeroOperacion).toBe('')
    expect(v.observacion).toBe('')
  })
})

describe('cambiosGarantiaEdicion', () => {
  const inicial = {
    fecha: '2026-10-20',
    idCliente: 2,
    idMedioPago: 1,
    idCuentaBancaria: null,
    numeroOperacion: '',
    importe: 50,
    observacion: 'nota',
  }
  it('sin cambios no envía nada', () => {
    expect(cambiosGarantiaEdicion(inicial, { ...inicial, observacion: ' nota ' })).toEqual({})
  })
  it('solo observación: no toca datos de caja', () => {
    expect(cambiosGarantiaEdicion(inicial, { ...inicial, observacion: 'otra' })).toEqual({
      observacion: 'otra',
    })
  })
  it('permite vaciar observación y nº de operación', () => {
    expect(
      cambiosGarantiaEdicion(
        { ...inicial, numeroOperacion: 'OP-1' },
        { ...inicial, numeroOperacion: ' ', observacion: '' },
      ),
    ).toEqual({ numeroOperacion: '', observacion: '' })
  })
  it('al cambiar el medio envía también la cuenta elegida', () => {
    expect(
      cambiosGarantiaEdicion(inicial, { ...inicial, idMedioPago: 7, idCuentaBancaria: 4 }),
    ).toEqual({ idMedioPago: 7, idCuentaBancaria: 4 })
  })
  it('cambio de cuenta con el mismo medio', () => {
    expect(
      cambiosGarantiaEdicion(
        { ...inicial, idCuentaBancaria: 3 },
        { ...inicial, idCuentaBancaria: 4 },
      ),
    ).toEqual({ idCuentaBancaria: 4 })
  })
  it('fecha, cliente e importe (redondeado) solo si cambian', () => {
    expect(
      cambiosGarantiaEdicion(inicial, {
        ...inicial,
        fecha: '2026-10-21',
        idCliente: 3,
        importe: 49.999,
      }),
    ).toEqual({ fecha: '2026-10-21', idCliente: 3 })
    expect(cambiosGarantiaEdicion(inicial, { ...inicial, importe: 60 })).toEqual({ importe: 60 })
  })
})
