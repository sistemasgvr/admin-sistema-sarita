import { esVentaSinDocumentoTipo } from '@/modules/ventas/comprobantes/constants/tipoComprobante'
import type { ComprobanteListItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import {
  bloqueada,
  disponible,
  noAplica,
  type Disponibilidad,
} from '@/shared/utils/accionDisponible'

/**
 * Reglas de disponibilidad de las acciones de Comprobantes y Notas de crédito.
 * Antes eran condiciones sueltas dentro de `hidden:`; aquí cada una dice si la
 * acción aplica al documento y, si todavía no se puede, por qué.
 */

type Fila = Pick<
  ComprobanteListItem,
  | 'codigo_tipo_comprobante'
  | 'nombre_tipo_comprobante'
  | 'nombre_estado_sunat'
  | 'estado_envio'
  | 'permite_edicion_segura'
  | 'tiene_cambio_fisico'
  | 'id_doc_salida'
  | 'id_cliente'
>

const FINALES = ['ACEPTADO', 'BAJA']

const esNotaVenta = (row: Fila) =>
  esVentaSinDocumentoTipo({ codigo: row.codigo_tipo_comprobante, nombre: row.nombre_tipo_comprobante })

const codigo = (row: Fila) => String(row.codigo_tipo_comprobante ?? '')
const nombreTipo = (row: Fila) => String(row.nombre_tipo_comprobante ?? '').toUpperCase()
const estado = (row: Fila) => row.nombre_estado_sunat ?? ''
const esFinal = (row: Fila) => FINALES.includes(estado(row))

export const MOTIVO_ENVIO_EN_CURSO =
  'Hay un envío a SUNAT en curso o por confirmar. Usa «Verificar envío».'

/** Motivo para acciones que esperan la aceptación de SUNAT. */
export function motivoEsperaSunat(estadoSunat: string | null | undefined): string {
  switch (estadoSunat) {
    case 'RECHAZADO':
      return 'SUNAT rechazó este comprobante.'
    case 'PENDIENTE':
    case '':
    case null:
    case undefined:
      return 'Disponible cuando SUNAT acepte el comprobante (hoy está pendiente).'
    default:
      return `Disponible cuando SUNAT acepte el comprobante (estado actual: ${estadoSunat.toLowerCase()}).`
  }
}

function esFacturaOBoleta(row: Fila) {
  if (['01', '03'].includes(codigo(row))) return true
  const nombre = nombreTipo(row)
  return (nombre.includes('FACTURA') || nombre.includes('BOLETA')) && !nombre.includes('NOTA')
}

function seAnulaPorBaja(row: Fila) {
  if (['01', '07', '08'].includes(codigo(row))) return true
  const nombre = nombreTipo(row)
  return (
    (nombre.includes('FACTURA') ||
      nombre.includes('NOTA_CREDITO') ||
      nombre.includes('NOTA_DEBITO') ||
      nombre.includes('NOTA CREDITO') ||
      nombre.includes('NOTA DEBITO')) &&
    !nombre.includes('BOLETA')
  )
}

// ── Comprobantes ───────────────────────────────────────────────────────────

export function dispCorregir(row: Fila): Disponibilidad {
  if (esFinal(row)) return noAplica
  if (row.estado_envio) return bloqueada(MOTIVO_ENVIO_EN_CURSO)
  if (['01', '03'].includes(codigo(row)) && row.permite_edicion_segura !== true) {
    return bloqueada(
      'Ya se envió a SUNAT y no se puede corregir sin riesgo. Usa nota de crédito o «Regularizar en serie nueva».',
    )
  }
  return disponible
}

export function dispEmitir(row: Fila): Disponibilidad {
  if (esNotaVenta(row) || estado(row) === 'NO_APLICA' || esFinal(row)) return noAplica
  if (row.estado_envio) return bloqueada(MOTIVO_ENVIO_EN_CURSO)
  return disponible
}

export function dispEliminar(row: Fila): Disponibilidad {
  if (esFinal(row)) return noAplica
  if (row.estado_envio) return bloqueada(MOTIVO_ENVIO_EN_CURSO)
  return disponible
}

export function dispGenerarOrdenSalida(row: Fila): Disponibilidad {
  if (row.id_doc_salida) return noAplica
  if (!row.id_cliente) return bloqueada('La venta no tiene cliente: asígnale uno para generar la orden.')
  return disponible
}

export function dispNotaCredito(row: Fila): Disponibilidad {
  if (esNotaVenta(row) || !esFacturaOBoleta(row)) return noAplica
  if (row.tiene_cambio_fisico) return bloqueada('Ya tiene un cambio físico registrado.')
  if (estado(row) !== 'ACEPTADO') return bloqueada(motivoEsperaSunat(estado(row)))
  return disponible
}

export function dispAnular(row: Fila): Disponibilidad {
  if (esNotaVenta(row) || !seAnulaPorBaja(row) || estado(row) === 'BAJA') return noAplica
  if (row.tiene_cambio_fisico) return bloqueada('Ya tiene un cambio físico registrado.')
  if (estado(row) !== 'ACEPTADO') return bloqueada(motivoEsperaSunat(estado(row)))
  return disponible
}

export function dispXml(row: Fila): Disponibilidad {
  if (!['01', '03', '07', '08'].includes(codigo(row))) return noAplica
  if (!esFinal(row)) return bloqueada(motivoEsperaSunat(estado(row)))
  return disponible
}

export function dispPdfA4(row: Fila): Disponibilidad {
  if (esNotaVenta(row) || esFinal(row) || estado(row) === 'NO_APLICA') return disponible
  return bloqueada(motivoEsperaSunat(estado(row)))
}

export function dispTicket(row: Fila): Disponibilidad {
  if (!esNotaVenta(row) && estado(row) === 'RECHAZADO') return bloqueada('SUNAT rechazó este comprobante.')
  return disponible
}

// ── Notas de crédito ───────────────────────────────────────────────────────

export function dispNcEditar(row: Fila): Disponibilidad {
  return esFinal(row) ? noAplica : disponible
}

export function dispNcAnular(row: Fila): Disponibilidad {
  if (estado(row) === 'BAJA') return noAplica
  if (estado(row) !== 'ACEPTADO') return bloqueada(motivoEsperaSunat(estado(row)))
  return disponible
}

/** PDF y XML de una NC: existen una vez que SUNAT la recibió. */
export function dispNcDocumento(row: Fila): Disponibilidad {
  return esFinal(row) ? disponible : bloqueada(motivoEsperaSunat(estado(row)))
}
