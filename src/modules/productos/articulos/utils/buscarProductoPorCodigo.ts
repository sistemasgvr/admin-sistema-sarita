import { productosService } from '@/modules/productos/articulos/services/productos.service'
import type {
  Producto,
  ProductoListFilters,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import { filtrarProductosCatalogo } from '@/modules/productos/articulos/utils/productosSistema'

function normalizarCodigo(value: string): string {
  return value.trim().toUpperCase()
}

function coincideCodigoExacto(producto: Producto, codigo: string): boolean {
  const needle = normalizarCodigo(codigo)
  if (!needle) return false
  const barra = producto.codigo_barra ? normalizarCodigo(producto.codigo_barra) : ''
  const sku = producto.codigo ? normalizarCodigo(producto.codigo) : ''
  const ubicacion = producto.codigo_ubicacion
    ? normalizarCodigo(producto.codigo_ubicacion)
    : ''
  return barra === needle || sku === needle || ubicacion === needle
}

export type BuscarProductoPorCodigoFilters = Pick<
  ProductoListFilters,
  | 'esGas'
  | 'esServicio'
  | 'esAlquilable'
  | 'esMantenimiento'
  | 'afectaStock'
  | 'soloActivos'
  | 'idAlmacen'
>

export interface BuscarProductoPorCodigoResult {
  producto: Producto | null
  candidatos: Producto[]
}

/**
 * Resuelve un producto a partir del código leído por pistola (o tecleado).
 * Prioridad: coincidencia exacta en codigo_barra → codigo → codigo_ubicacion;
 * si no hay exacta y solo hay 1 candidato del buscar, lo usa.
 */
export async function buscarProductoPorCodigo(
  codigoRaw: string,
  filters: BuscarProductoPorCodigoFilters = {},
): Promise<BuscarProductoPorCodigoResult> {
  const codigo = codigoRaw.trim()
  if (!codigo) {
    return { producto: null, candidatos: [] }
  }

  const response = await productosService.listar({
    pagina: 1,
    limite: 30,
    soloActivos: filters.soloActivos ?? 1,
    incluirImagenes: false,
    buscar: codigo,
    esGas: filters.esGas,
    esServicio: filters.esServicio,
    esAlquilable: filters.esAlquilable,
    esMantenimiento: filters.esMantenimiento,
    afectaStock: filters.afectaStock,
    idAlmacen: filters.idAlmacen,
  })

  const candidatos = filtrarProductosCatalogo(response.data ?? [])
  const exacto = candidatos.find((item) => coincideCodigoExacto(item, codigo))
  if (exacto) {
    return { producto: exacto, candidatos }
  }
  if (candidatos.length === 1) {
    return { producto: candidatos[0] ?? null, candidatos }
  }
  return { producto: null, candidatos }
}
