import { describe, expect, it } from 'vitest'
import {
  dispAnular,
  dispCorregir,
  dispGenerarOrdenSalida,
  dispNcDocumento,
  dispNotaCredito,
  dispPdfA4,
  dispTicket,
  dispXml,
  MOTIVO_ENVIO_EN_CURSO,
} from './disponibilidadAcciones'
import { estadoAccion } from '@/shared/utils/accionDisponible'

const factura = (extra: Record<string, unknown> = {}) => ({
  codigo_tipo_comprobante: '01',
  nombre_tipo_comprobante: 'FACTURA',
  nombre_estado_sunat: 'ACEPTADO',
  id_cliente: 10,
  ...extra,
})

describe('Descargar XML (reclamo del 18/11)', () => {
  it('se muestra deshabilitado con motivo mientras SUNAT no acepta', () => {
    const d = dispXml(factura({ nombre_estado_sunat: 'PENDIENTE' }))
    expect(d.aplica).toBe(true)
    expect(d.motivo).toContain('Disponible cuando SUNAT acepte')
  })

  it('está disponible para facturas, boletas y notas aceptadas', () => {
    for (const codigo of ['01', '03', '07', '08']) {
      expect(dispXml(factura({ codigo_tipo_comprobante: codigo })).motivo).toBeNull()
    }
  })

  it('no aplica a una nota de venta', () => {
    expect(dispXml(factura({ codigo_tipo_comprobante: 'NV', nombre_tipo_comprobante: 'NOTA DE VENTA' })).aplica).toBe(false)
  })

  it('explica el rechazo de SUNAT', () => {
    expect(dispXml(factura({ nombre_estado_sunat: 'RECHAZADO' })).motivo).toBe('SUNAT rechazó este comprobante.')
  })
})

describe('reglas de estado', () => {
  it('corregir: bloqueado por envío en curso', () => {
    const d = dispCorregir(factura({ nombre_estado_sunat: 'PENDIENTE', estado_envio: 'EN_CURSO', permite_edicion_segura: true }))
    expect(d.motivo).toBe(MOTIVO_ENVIO_EN_CURSO)
  })

  it('corregir: no aplica a un comprobante aceptado', () => {
    expect(dispCorregir(factura()).aplica).toBe(false)
  })

  it('nota de crédito: espera la aceptación', () => {
    expect(dispNotaCredito(factura({ nombre_estado_sunat: 'PENDIENTE' })).motivo).toContain('pendiente')
  })

  it('nota de crédito: bloqueada por cambio físico', () => {
    expect(dispNotaCredito(factura({ tiene_cambio_fisico: true })).motivo).toContain('cambio físico')
  })

  it('anular: no aplica a boletas', () => {
    expect(dispAnular(factura({ codigo_tipo_comprobante: '03', nombre_tipo_comprobante: 'BOLETA' })).aplica).toBe(false)
  })

  it('orden de salida: pide cliente', () => {
    expect(dispGenerarOrdenSalida(factura({ id_cliente: 0 })).motivo).toContain('no tiene cliente')
    expect(dispGenerarOrdenSalida(factura({ id_doc_salida: 4 })).aplica).toBe(false)
  })

  it('PDF y ticket', () => {
    expect(dispPdfA4(factura({ nombre_estado_sunat: 'PENDIENTE' })).motivo).not.toBeNull()
    expect(dispTicket(factura({ nombre_estado_sunat: 'RECHAZADO' })).motivo).not.toBeNull()
    expect(dispTicket(factura({ nombre_estado_sunat: 'PENDIENTE' })).motivo).toBeNull()
  })

  it('NC: PDF/XML deshabilitados hasta la aceptación', () => {
    expect(dispNcDocumento(factura({ codigo_tipo_comprobante: '07', nombre_estado_sunat: 'PENDIENTE' })).motivo).not.toBeNull()
  })
})

describe('estadoAccion', () => {
  it('la falta de permiso siempre oculta', () => {
    expect(estadoAccion(false, { aplica: true, motivo: 'x' }).hidden).toBe(true)
  })

  it('un motivo deshabilita y se expone', () => {
    expect(estadoAccion(true, { aplica: true, motivo: 'Espera' })).toEqual({
      hidden: false,
      disabled: true,
      disabledReason: 'Espera',
    })
  })

  it('ocupado deshabilita sin motivo', () => {
    expect(estadoAccion(true, { aplica: true, motivo: null }, true)).toEqual({
      hidden: false,
      disabled: true,
      disabledReason: undefined,
    })
  })
})
