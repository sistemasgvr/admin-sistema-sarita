import type {
  DashboardFiltros,
  DashboardPresetId,
  DashboardRangoFecha,
} from '@/modules/dashboard/interfaces/dashboard-filtros.interface'
import type { RangoFechas } from '@/shared/interfaces/form.interface'
import { displayDDMMYYYY } from '@/shared/utils/dateRange'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export const PRESETS_PERIODO: { id: DashboardPresetId; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'esteMes', label: 'Este mes' },
  { id: 'ultimos30', label: 'Últimos 30 días' },
  { id: 'esteAnio', label: 'Este año' },
]
export function rangoPreset(preset: DashboardPresetId): RangoFechas {
  const ahora = new Date()
  const y = ahora.getFullYear()

  switch (preset) {
    case 'hoy': {
      const iso = isoDe(ahora)
      return { start: iso, end: iso }
    }
    case 'esteMes':
      return {
        start: `${y}-${pad2(ahora.getMonth() + 1)}-01`,
        end: `${y}-${pad2(ahora.getMonth() + 1)}-${pad2(
          new Date(y, ahora.getMonth() + 1, 0).getDate(),
        )}`,
      }
    case 'ultimos30': {
      const desde = new Date(ahora)
      desde.setDate(ahora.getDate() - 29)
      return { start: isoDe(desde), end: isoDe(ahora) }
    }
    case 'esteAnio':
      return { start: `${y}-01-01`, end: `${y}-12-31` }
  }
}

function isoDe(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Etiqueta legible del rango para el badge de filtros activos. */
export function etiquetaPeriodo(periodo: RangoFechas): string {
  const { start, end } = periodo
  if (!start && !end) return ''
  if (start && end) return `${displayDDMMYYYY(start)} — ${displayDDMMYYYY(end)}`
  if (start) return `Desde ${displayDDMMYYYY(start)}`
  return `Hasta ${displayDDMMYYYY(end)}`
}

/** Convierte el período seleccionado a un rango de fechas para las queries. */
export function rangoDesdeFiltros(filtros: DashboardFiltros): DashboardRangoFecha {
  const { start, end } = filtros.periodo
  if (!start && !end) return {}
  return {
    ...(start ? { fechaDesde: start } : {}),
    ...(end ? { fechaHasta: end } : {}),
  }
}

/**
 * Resuelve el cliente buscado por texto (nombre/DNI/código) a un id interno
 * cuando el término es numérico. El resto (nombres/razones) se resolverá en el
 * backend una vez esté implementada la lógica de búsqueda.
 */
export function clienteIdDesdeTexto(busqueda: string): number | undefined {
  const term = busqueda.trim()
  if (!term) return undefined
  if (/^\d{1,10}$/.test(term)) return Number(term)
  return undefined
}