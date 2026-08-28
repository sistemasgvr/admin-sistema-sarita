import type { RouteLocationRaw } from 'vue-router'
import type {
  Comprobante,
  ComprobanteListItem,
} from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'

/**
 * Ruta al formulario de nueva GRE precargada desde una venta.
 * El formulario usa `idComprobante` para traer detalles y sucursal/almacén;
 * los `ref*` son respaldo si la consulta del comprobante falla.
 */
export function rutaNuevaGuiaDesdeComprobante(
  comprobante: Comprobante | ComprobanteListItem,
): RouteLocationRaw {
  return {
    name: 'admin-ventas-guias-remision-nueva',
    query: {
      idComprobante: String(comprobante.id),
      idCliente: String(comprobante.id_cliente),
      refSerie: comprobante.serie,
      refNumero: String(comprobante.numero),
      refTipo: String(comprobante.id_tipo_comprobante),
      refFecha: String(comprobante.fecha).slice(0, 10),
      refTipoNombre: comprobante.nombre_tipo_comprobante ?? undefined,
    },
  }
}
