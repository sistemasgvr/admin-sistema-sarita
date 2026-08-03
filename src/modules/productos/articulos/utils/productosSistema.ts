import {
  CODIGOS_PRODUCTO_SISTEMA,
  type CodigoProductoSistema,
} from '@/modules/productos/articulos/constants/productosSistema'

/** Producto interno del sistema (facturación POS); no se vende/elige como catálogo. */
export function codigoProductoSistema(
  codigo?: string | null,
): CodigoProductoSistema | null {
  const value = (codigo ?? '').trim().toUpperCase()
  return (CODIGOS_PRODUCTO_SISTEMA as readonly string[]).includes(value)
    ? (value as CodigoProductoSistema)
    : null
}

export function esProductoSistema(producto?: { codigo?: string | null } | null): boolean {
  return codigoProductoSistema(producto?.codigo) != null
}

export function filtrarProductosCatalogo<T extends { codigo?: string | null }>(
  items: T[],
): T[] {
  return items.filter((item) => !esProductoSistema(item))
}
