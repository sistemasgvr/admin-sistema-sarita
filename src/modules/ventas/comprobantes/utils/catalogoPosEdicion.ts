import type { ProductoListFilters } from '@/modules/productos/articulos/interfaces/producto.interface'
import {
  isOrigenPos,
  OrigenPos,
  type OrigenPosValue,
} from '@/modules/ventas/comprobantes/constants/origenPos'

export type CatalogoPosEdicion =
  | 'accesorios'
  | 'recarga'
  | 'servicios'
  | 'medicinal'
  | 'todos'

type ProductoFlags = {
  es_gas?: boolean | null
  es_servicio?: boolean | null
}

/**
 * Resuelve el catálogo de edición:
 * 1) origen_pos guardado al emitir (preferido)
 * 2) inferencia por flags del detalle (comprobantes antiguos)
 */
export function resolverCatalogoPosEdicion(options: {
  origenPos?: string | null
  detalles?: ProductoFlags[]
}): CatalogoPosEdicion {
  if (isOrigenPos(options.origenPos)) {
    return catalogoDesdeOrigenPos(options.origenPos)
  }
  return inferirCatalogoPosEdicion(options.detalles ?? [])
}

export function catalogoDesdeOrigenPos(origen: OrigenPosValue): CatalogoPosEdicion {
  switch (origen) {
    case OrigenPos.ACCESORIOS:
      return 'accesorios'
    case OrigenPos.RECARGA:
      return 'recarga'
    case OrigenPos.MANTENIMIENTO:
      return 'servicios'
    case OrigenPos.MEDICINAL:
      return 'medicinal'
    case OrigenPos.INDUSTRIAL:
    default:
      return 'todos'
  }
}

/** Fallback para comprobantes sin origen_pos. */
export function inferirCatalogoPosEdicion(items: ProductoFlags[]): CatalogoPosEdicion {
  if (!items.length) return 'todos'

  const allAccesorios = items.every((item) => !item.es_gas && !item.es_servicio)
  if (allAccesorios) return 'accesorios'

  const allGas = items.every((item) => Boolean(item.es_gas))
  if (allGas) return 'recarga'

  const allServicio = items.every((item) => Boolean(item.es_servicio))
  if (allServicio) return 'servicios'

  return 'todos'
}

export function labelCatalogoPosEdicion(catalogo: CatalogoPosEdicion): string {
  switch (catalogo) {
    case 'accesorios':
      return 'Catálogo Accesorios (POS)'
    case 'recarga':
      return 'Catálogo Recarga / gases (POS)'
    case 'servicios':
      return 'Catálogo Mantenimiento / servicios (POS)'
    case 'medicinal':
      return 'Catálogo Medicinal (productos y servicios del kit)'
    default:
      return 'Catálogo completo'
  }
}

export function filtrosPorCatalogoPos(
  catalogo: CatalogoPosEdicion,
): Pick<ProductoListFilters, 'esGas' | 'esServicio' | 'esAlquilable'> {
  switch (catalogo) {
    case 'accesorios':
      return { esGas: false, esServicio: false }
    case 'recarga':
      return { esGas: true }
    case 'servicios':
      return { esServicio: true }
    case 'medicinal':
      // Kit mezcla regulador (servicio), contenido y flete: sin filtro estricto.
      return {}
    default:
      return {}
  }
}
