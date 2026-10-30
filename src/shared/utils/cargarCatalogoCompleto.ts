import type { PaginatedResult } from '@/shared/api/interfaces/api.interface'

/** Catálogos para selección: publicar resultados solo cuando se hayan leído todas las páginas. */
export async function cargarCatalogoCompleto<F extends { pagina?: number; limite?: number }, T>(
  listar: (filters: F) => Promise<PaginatedResult<T[]>>,
  filters: F,
  signal?: AbortSignal,
): Promise<PaginatedResult<T[]>> {
  signal?.throwIfAborted()
  const primera = await listar({ ...filters, pagina: 1, limite: 200 })
  const registros = [...primera.data]
  // Usar el tamaño efectivo del servidor, que puede ser menor al solicitado.
  const limite = Number(primera.meta.limite)
  let total = Number(primera.meta.total)
  if (!Number.isFinite(total) || total < 0 || !Number.isInteger(limite) || limite < 1) {
    throw new Error('No se pudo comprobar que el catálogo esté completo')
  }
  if (registros.length === 0 && total > 0) {
    throw new Error('No se pudo cargar el catálogo completo. Reintenta.')
  }
  for (let pagina = 2; registros.length < total; pagina++) {
    signal?.throwIfAborted()
    const siguiente = await listar({ ...filters, pagina, limite })
    if (siguiente.data.length === 0) {
      throw new Error('No se pudo cargar el catálogo completo. Reintenta.')
    }
    registros.push(...siguiente.data)
    total = Math.max(total, Number(siguiente.meta.total) || 0)
  }
  signal?.throwIfAborted()
  return {
    data: registros,
    meta: { ...primera.meta, pagina: 1, limite: Math.max(1, registros.length), total: registros.length },
  }
}
