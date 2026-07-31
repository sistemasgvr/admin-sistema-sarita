import { inject, provide, type ComputedRef, type InjectionKey } from 'vue'

export interface DashboardGlobalFilters {
  fechaDesde?: string
  fechaHasta?: string
  idCliente?: number
}

const KEY: InjectionKey<ComputedRef<DashboardGlobalFilters>> = Symbol('dashboardFilters')

/** Publica los filtros globales del dashboard (llamar en el contenedor). */
export function provideDashboardFilters(filters: ComputedRef<DashboardGlobalFilters>) {
  provide(KEY, filters)
}

/** Consume los filtros globales del dashboard (llamar en cada tab). */
export function useDashboardFilters(): ComputedRef<DashboardGlobalFilters> {
  const filters = inject(KEY)
  if (!filters) {
    throw new Error('useDashboardFilters debe usarse dentro de DashboardView')
  }
  return filters
}
