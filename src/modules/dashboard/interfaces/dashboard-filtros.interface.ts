import type { RangoFechas } from '@/shared/interfaces/form.interface'

export interface DashboardFiltros {
  periodo: RangoFechas
  busquedaCliente: string
}

export interface DashboardRangoFecha {
  fechaDesde?: string
  fechaHasta?: string
}

export type DashboardPresetId = 'hoy' | 'esteMes' | 'ultimos30' | 'esteAnio'