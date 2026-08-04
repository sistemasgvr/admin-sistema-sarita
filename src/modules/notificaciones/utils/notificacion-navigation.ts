import type { RouteLocationRaw } from 'vue-router'
import type { Notificacion } from '@/modules/notificaciones/interfaces/notificacion.interface'

function payloadNumber(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): number | null {
  const value = Number(payload?.[key])
  return Number.isInteger(value) && value > 0 ? value : null
}

function payloadString(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): string {
  const value = payload?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

/** Ruta con query/params para abrir el registro concreto de la notificación. */
export function resolveNotificacionTarget(
  item: Notificacion,
): RouteLocationRaw | null {
  const idRef =
    item.id_referencia != null && Number(item.id_referencia) > 0
      ? Number(item.id_referencia)
      : null
  const payload = item.payload ?? {}
  const codigo = (item.codigo_tipo ?? '').toUpperCase()

  switch (item.tipo_referencia) {
    case 'ALQUILER':
      return idRef
        ? { name: 'admin-balones-alquileres', query: { id: String(idRef) } }
        : { name: 'admin-balones-alquileres' }

    case 'PRESTAMO': {
      const idPrestamo = payloadNumber(payload, 'idPrestamo') ?? idRef
      return idPrestamo
        ? { name: 'admin-balones-prestamos', query: { id: String(idPrestamo) } }
        : { name: 'admin-balones-prestamos' }
    }

    case 'BALON': {
      const idBalon = payloadNumber(payload, 'idBalon')
      if (
        (codigo.includes('APROBADA') || codigo.includes('RECHAZADA')) &&
        idBalon
      ) {
        return {
          name: 'admin-balones-cilindros-detalle',
          params: { id: String(idBalon) },
        }
      }
      return {
        name: 'admin-balones-cilindros',
        query: {
          tab: 'aprobaciones',
          ...(idRef ? { idBaja: String(idRef) } : {}),
        },
      }
    }

    case 'CLIENTE': {
      const idCliente = payloadNumber(payload, 'idCliente')
      if (
        (codigo.includes('APROBADA') || codigo.includes('RECHAZADA')) &&
        idCliente
      ) {
        return {
          name: 'admin-clientes-editar',
          params: { id: String(idCliente) },
        }
      }
      return {
        name: 'admin-clientes',
        query: {
          tab: 'aprobaciones',
          ...(idRef ? { idBaja: String(idRef) } : {}),
        },
      }
    }

    case 'COMPROBANTE':
      return idRef
        ? { name: 'admin-ventas-comprobantes', query: { id: String(idRef) } }
        : { name: 'admin-ventas-comprobantes' }

    case 'GUIA_REMISION':
      return idRef
        ? { name: 'admin-ventas-guias-remision', query: { id: String(idRef) } }
        : { name: 'admin-ventas-guias-remision' }

    case 'DOCUMENTO_VENCIMIENTO': {
      const idVehiculo = payloadNumber(payload, 'idVehiculo')
      if (idVehiculo) {
        return {
          name: 'admin-clientes-vehiculos',
          query: { id: String(idVehiculo) },
        }
      }
      const placa = payloadString(payload, 'vehiculoPlaca')
      return placa
        ? { name: 'admin-clientes-vehiculos', query: { buscar: placa } }
        : { name: 'admin-clientes-vehiculos' }
    }

    case 'LICENCIA': {
      const idChofer = payloadNumber(payload, 'idChofer')
      return idChofer
        ? { name: 'admin-clientes-choferes', query: { id: String(idChofer) } }
        : { name: 'admin-clientes-choferes' }
    }

    case 'STOCK': {
      const query: Record<string, string> = {}
      if (idRef) query.id = String(idRef)
      const idAlmacen = payloadNumber(payload, 'idAlmacen')
      if (idAlmacen) query.idAlmacen = String(idAlmacen)
      return { name: 'admin-productos-stock', query }
    }

    default:
      return null
  }
}
