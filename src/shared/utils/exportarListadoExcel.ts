import type { PaginatedResult } from '@/shared/api/interfaces/api.interface'
import { toastInfo } from '@/shared/composables/useToast'
import { hoyIsoLima } from '@/shared/utils/date'
import { downloadExcel, type ExcelColumn } from '@/shared/utils/exportExcel'

export type CampoExcel<T> = readonly [
  keyof T & string,
  string,
  ('numero' | 'estado' | 'anulacion')?,
]

export function columnasListadoExcel<T>(campos: readonly CampoExcel<T>[]): ExcelColumn<T>[] {
  return campos.map(([key, header, tipo]) => ({
    key,
    header,
    width: Math.min(45, Math.max(16, header.length + 4)),
    value: (row) => {
      const value = row[key]
      if (value == null) return ''
      if (tipo === 'estado') return value === true || Number(value) === 1 ? 'Activo' : 'Inactivo'
      if (tipo === 'anulacion') return Number(value) === 1 ? 'Activo' : 'Anulado'
      if (typeof value === 'boolean') return value ? 'Sí' : 'No'
      if (tipo === 'numero' && value !== '') {
        const numero = Number(value)
        if (Number.isFinite(numero)) return numero
      }
      if (typeof value === 'number') return value
      // Las únicas colecciones incluidas son campos expresamente seleccionados,
      // por ejemplo los nombres de roles. Nunca se vuelca el objeto de la API.
      if (Array.isArray(value)) {
        return value
          .map((item: unknown) => {
            if (item && typeof item === 'object' && 'nombre' in item) return String(item.nombre)
            return typeof item === 'string' || typeof item === 'number' ? String(item) : ''
          })
          .filter(Boolean)
          .join(', ')
      }
      return typeof value === 'string' ? value : ''
    },
  }))
}

export async function obtenerFilasExcel<F extends object, T>(
  listar: (filters: F) => Promise<PaginatedResult<T[]>>,
  filters: F,
  paginacion: 'limite' | 'tamano' = 'limite',
): Promise<T[]> {
  // La copia evita que una búsqueda/cambio de página durante la descarga
  // mezcle registros correspondientes a distintos filtros.
  const snapshot = { ...filters }
  const primera = await listar({ ...snapshot, pagina: 1, [paginacion]: 500 })
  const rows = [...primera.data]
  const total = primera.meta.total || rows.length
  const limite = primera.meta.limite > 0 ? primera.meta.limite : rows.length || 500
  for (let pagina = 2; pagina <= Math.ceil(total / limite); pagina++) {
    const siguiente = await listar({ ...snapshot, pagina, [paginacion]: limite })
    rows.push(...siguiente.data)
  }
  if (rows.length < total)
    throw new Error('El servidor devolvió un listado incompleto. Vuelve a exportar el reporte.')
  return rows
}

export async function exportarListadoExcel<F extends object, T>(options: {
  nombre: string
  listar: (filters: F) => Promise<PaginatedResult<T[]>>
  filtros: F
  campos: readonly CampoExcel<NoInfer<T>>[]
  paginacion?: 'limite' | 'tamano'
  seleccionar?: (row: T) => boolean
}): Promise<void> {
  let rows = await obtenerFilasExcel(options.listar, options.filtros, options.paginacion)
  if (options.seleccionar) rows = rows.filter(options.seleccionar)
  await exportarFilasExcel(options.nombre, rows, options.campos)
}

/** Para indicadores y colecciones sin paginación: exporta los datos del filtro cargado. */
export async function exportarFilasExcel<T>(
  nombre: string,
  rows: T[],
  campos: readonly CampoExcel<NoInfer<T>>[],
): Promise<void> {
  if (!rows.length) {
    toastInfo('No hay registros que coincidan con los filtros actuales')
    return
  }
  const filename = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
  await downloadExcel({
    filename: `${filename}_${hoyIsoLima()}`,
    sheetName: nombre.replace(/[\\/*?:[\]]/g, ' ').slice(0, 31),
    rows,
    columns: columnasListadoExcel(campos),
  })
}
