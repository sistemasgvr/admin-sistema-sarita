import { fetchAllPaginated } from '@/shared/utils/pagination'

export const estadoTexto = (estado: number) => (estado === 1 ? 'Activo' : 'Inactivo')
export const siNo = (valor: boolean) => (valor ? 'Sí' : 'No')

export const nombreClienteRelacionado = (registro: {
  cliente_razon_social?: string | null
  cliente_nombres?: string | null
  cliente_apellido_paterno?: string | null
  cliente_apellido_materno?: string | null
  cliente_numero_documento?: string | null
}) => {
  if (registro.cliente_razon_social) return registro.cliente_razon_social
  const nombreCompleto = [
    registro.cliente_nombres,
    registro.cliente_apellido_paterno,
    registro.cliente_apellido_materno,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
  return nombreCompleto || registro.cliente_numero_documento || '—'
}

/** @deprecated Preferir fetchAllPaginated desde @/shared/utils/pagination */
export const fetchAll = fetchAllPaginated

export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const resultados: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const lote = items.slice(i, i + batchSize)
    resultados.push(...(await Promise.all(lote.map(task))))
  }
  return resultados
}
