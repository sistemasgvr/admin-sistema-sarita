import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { lotesProtocoloQueryKeys } from '@/modules/balones/lotes-protocolo/constants/lotesProtocoloQueryKeys'
import { lotesProtocoloService } from '@/modules/balones/lotes-protocolo/services/lotes-protocolo.service'
import type { LoteProtocoloListFilters } from '@/modules/balones/lotes-protocolo/interfaces/lote-protocolo.interface'

export function useLotesProtocoloQuery(filters: Ref<LoteProtocoloListFilters>) {
  return useQuery({
    queryKey: computed(() => lotesProtocoloQueryKeys.list(filters.value)),
    queryFn: () => lotesProtocoloService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useLoteProtocoloQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => lotesProtocoloQueryKeys.detail(id.value ?? 0)),
    queryFn: () => lotesProtocoloService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}

/**
 * Historial de fichas de un cilindro. Solo tiene sentido pedirlo para cilindros
 * de gas medicinal, así que el llamador controla `enabled` con `activo`.
 */
export function useLoteProtocoloHistorialQuery(
  idBalon: Ref<number | null | undefined>,
  activo?: Ref<boolean>,
) {
  return useQuery({
    queryKey: computed(() => lotesProtocoloQueryKeys.historial(idBalon.value ?? 0)),
    queryFn: () => lotesProtocoloService.historialPorBalon(idBalon.value!),
    enabled: computed(
      () => idBalon.value != null && idBalon.value > 0 && (activo?.value ?? true),
    ),
  })
}
