import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, ref, type Ref } from 'vue'
import { comprobantesQueryKeys } from '@/modules/ventas/comprobantes/constants/comprobantesQueryKeys'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { ComprobanteListFilters, ResumenDiarioListFilters } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'

export function useComprobantesQuery(filters: Ref<ComprobanteListFilters>) {
  return useQuery({
    queryKey: computed(() => comprobantesQueryKeys.list(filters.value)),
    queryFn: () => comprobantesService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useComprobanteQuery(id: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => comprobantesQueryKeys.detail(id.value ?? 0)),
    queryFn: () => comprobantesService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}

/**
 * Catálogos POS: 7 listas de gen_lista cargadas en paralelo.
 * Mantiene la misma interfaz que el viejo useComprobanteCatalogosPosQuery
 * pero usa useListaOpcionesQuery por lista.
 */
export function useComprobanteCatalogosPosQuery() {
  const tiposComprobante = useListaOpcionesQuery(ref(ListaIds.TIPO_COMPROBANTE))
  const afectacionesIgv = useListaOpcionesQuery(ref(ListaIds.AFECTACION_IGV))
  const monedas = useListaOpcionesQuery(ref(ListaIds.MONEDA))
  const mediosPago = useListaOpcionesQuery(ref(ListaIds.MEDIO_PAGO))
  const tiposOperacionSunat = useListaOpcionesQuery(ref(ListaIds.TIPO_OPERACION_SUNAT))
  const estadosSunat = useListaOpcionesQuery(ref(ListaIds.ESTADO_SUNAT))
  const motivosNotaCredito = useListaOpcionesQuery(ref(ListaIds.MOTIVO_NOTA_CREDITO))

  const isLoading = computed(() =>
    tiposComprobante.isLoading.value ||
    afectacionesIgv.isLoading.value ||
    monedas.isLoading.value ||
    mediosPago.isLoading.value ||
    tiposOperacionSunat.isLoading.value ||
    estadosSunat.isLoading.value ||
    motivosNotaCredito.isLoading.value,
  )

  const isFetching = computed(() =>
    tiposComprobante.isFetching.value ||
    afectacionesIgv.isFetching.value ||
    monedas.isFetching.value ||
    mediosPago.isFetching.value ||
    tiposOperacionSunat.isFetching.value ||
    estadosSunat.isFetching.value ||
    motivosNotaCredito.isFetching.value,
  )

  const data = computed(() => {
    if (isLoading.value) return undefined
    return {
      tiposComprobante: tiposComprobante.data.value ?? [],
      afectacionesIgv: afectacionesIgv.data.value ?? [],
      monedas: monedas.data.value ?? [],
      mediosPago: mediosPago.data.value ?? [],
      tiposOperacionSunat: tiposOperacionSunat.data.value ?? [],
      estadosSunat: estadosSunat.data.value ?? [],
      motivosNotaCredito: motivosNotaCredito.data.value ?? [],
    }
  })

  return { data, isLoading, isFetching }
}

export function useResumenDiarioListQuery(filters: Ref<ResumenDiarioListFilters>) {
  return useQuery({
    queryKey: computed(() => comprobantesQueryKeys.resumenList(filters.value)),
    queryFn: () => comprobantesService.listarResumenDiario(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useResumenDiarioQuery(id: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => comprobantesQueryKeys.resumenDetail(id.value ?? 0)),
    queryFn: () => comprobantesService.obtenerResumenDiario(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
