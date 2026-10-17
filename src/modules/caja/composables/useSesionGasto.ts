import { computed, ref, watch, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { cajaService } from '@/modules/caja/services/caja.service'
import { cajaQueryKeys } from '@/modules/caja/constants/cajaQueryKeys'

/** Selección explícita de caja cuando el gasto se abre fuera de Caja del día. */
export function useSesionGasto(fecha: Ref<string | undefined>, requerida: Ref<boolean>, open: Ref<boolean>) {
  const idSesion = ref<number | null>(null)
  const query = useQuery({
    queryKey: computed(() => [...cajaQueryKeys.all, 'sesiones-gasto', fecha.value]),
    queryFn: () => cajaService.listarSesiones({
      fechaDesde: fecha.value, fechaHasta: fecha.value, estadoCaja: 'ABIERTA', pagina: 1, limite: 100,
    }),
    enabled: computed(() => open.value && requerida.value && Boolean(fecha.value)),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const sesiones = computed(() => (query.data.value?.data ?? []).filter(
    s => s.id != null && s.fecha.slice(0, 10) === fecha.value && s.estadoCaja === 'ABIERTA',
  ))
  const seleccion = computed(() => sesiones.value.find(s => s.id === idSesion.value))
  const options = computed(() => sesiones.value.map(s => ({
    value: s.id as number, label: `${s.nombreSucursal ?? 'Caja general'} · ${s.fecha.slice(0, 10)}`,
  })))
  watch([open, fecha], () => { idSesion.value = null }, { flush: 'sync' })
  watch([sesiones, open, () => query.isFetching.value], () => {
    if (!open.value || query.isFetching.value) return
    if (!seleccion.value) idSesion.value = sesiones.value.length === 1 ? sesiones.value[0]!.id : null
  }, { immediate: true })
  const valida = computed(() => !requerida.value || (
    !query.isFetching.value && !query.isError.value && Boolean(seleccion.value)
  ))
  return { idSesion, query, options, seleccion, valida }
}
