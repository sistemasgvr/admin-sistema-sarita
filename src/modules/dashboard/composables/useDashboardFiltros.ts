import { computed, reactive } from 'vue'
import type { DashboardFiltros } from '@/modules/dashboard/interfaces/dashboard-filtros.interface'

const state = reactive<DashboardFiltros>({
  periodo: { start: '', end: '' },
  busquedaCliente: '',
})

/**
 * Filtros generales del dashboard (periodo con calendario y cliente). El estado
 * es compartido entre todas las pestañas/vistas del dashboard para que los
 * filtros aplicados en una se mantengan en las demás.
 */
export function useDashboardFiltros() {
  const limpiar = () => {
    state.periodo = { start: '', end: '' }
    state.busquedaCliente = ''
  }

  const tieneFiltros = computed(
    () =>
      state.periodo.start !== '' ||
      state.periodo.end !== '' ||
      state.busquedaCliente.trim() !== '',
  )

  return {
    filtros: state,
    limpiar,
    tieneFiltros,
  }
}