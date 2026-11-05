import { describe, expect, it } from 'vitest'
import { formatListaOpcionLabel } from './formatListaOpcion'

describe('formatListaOpcionLabel', () => {
  it.each([
    ['SALIDA_PRESTAMO', 'Salida préstamo'],
    ['SALIDA_VENTA', 'Salida venta'],
    ['ENTRADA_GARANTIA', 'Entrada garantía'],
    ['ENTRADA_DEVOLUCION', 'Entrada devolución'],
    ['ENTRADA_RETORNO_RUTA_PUEBLO', 'Entrada retorno ruta pueblo'],
    ['REPOSICION', 'Reposición'],
    ['RETORNO_LIMA', 'Retorno Lima'],
    ['TRASLADO_LIMA', 'Traslado Lima'],
    ['AJUSTE', 'Ajuste'],
  ])('tipo de movimiento %s', (codigo, etiqueta) => {
    expect(formatListaOpcionLabel(codigo)).toBe(etiqueta)
  })

  it.each([
    ['FACTURA', 'Factura'],
    ['NOTA_CREDITO', 'Nota crédito'],
    ['ORDEN_SALIDA', 'Orden salida'],
    ['CAMBIO_VSD', 'Cambio VSD'],
    ['GRE', 'GRE'],
  ])('tipo de documento %s', (codigo, etiqueta) => {
    expect(formatListaOpcionLabel(codigo)).toBe(etiqueta)
  })

  it('muestra la naturaleza con tilde', () => {
    expect(formatListaOpcionLabel('BALON')).toBe('Balón')
    expect(formatListaOpcionLabel('PRODUCTO')).toBe('Producto')
  })
})
