import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch, onScopeDispose, type Ref } from 'vue'
import { comprobantesQueryKeys } from '@/modules/ventas/comprobantes/constants/comprobantesQueryKeys'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { ComprobanteListFilters, ResumenDiarioListFilters } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'

export function useComprobantesQuery(filters: Ref<ComprobanteListFilters>, emitiendo?: Ref<boolean>, sincronizar?: Ref<boolean>) {
  const queryClient = useQueryClient()
  const ultimasConsultas = new Map<number, number>()
  let consultando = false
  let activo = true
  onScopeDispose(() => { activo = false })
  const query = useQuery({
    queryKey: computed(() => comprobantesQueryKeys.list(filters.value)),
    queryFn: () => comprobantesService.listar(filters.value),
    refetchInterval: (query) => emitiendo?.value || query.state.data?.data.some(row => ['EN_CURSO', 'POR_CONFIRMAR'].includes(row.estado_envio ?? '')) ? 3000 : false,
    placeholderData: keepPreviousData,
  })
  // Reconciliación en segundo plano: una consulta a la vez, cada 15 s por CPE.
  // Una consulta fallida o NO INFORMADO conserva el estado y nunca reenvía.
  watch(query.dataUpdatedAt, async () => {
    if (!activo || !sincronizar?.value || consultando) return
    const row = query.data.value?.data.filter(item =>
      ['01', '03'].includes(String(item.codigo_tipo_comprobante)) &&
      ['EN_CURSO', 'POR_CONFIRMAR'].includes(item.estado_envio ?? '') &&
      Date.now() - (ultimasConsultas.get(item.id) ?? 0) >= 15000,
    ).sort((a, b) => (ultimasConsultas.get(a.id) ?? 0) - (ultimasConsultas.get(b.id) ?? 0))[0]
    if (!row) return
    consultando = true
    ultimasConsultas.set(row.id, Date.now())
    try {
      const validez = await comprobantesService.sincronizarValidez(row.id)
      if (activo && validez.estadoActualizado) {
        await queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
      }
    } catch { /* Reintenta la consulta en la siguiente ventana; no cambia el estado. */ }
    finally { consultando = false }
  })
  return query
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
