import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toastApiError, toastError, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { TRIBUTOS_CONFIG } from '../config/tributos.config'
import { tributosQueryKeys } from '../constants/tributosQueryKeys'
import { createTributoService } from '../services/tributos.service'
import type { CrearTributoPayload, TipoTributo } from '../interfaces/tributo.interface'

export function useCrearTributoMutation(tipo: TipoTributo) {
  const queryClient = useQueryClient()
  const service = createTributoService(tipo)
  const { singular } = TRIBUTOS_CONFIG[tipo]
  return useMutation({
    mutationFn: (payload: CrearTributoPayload) => service.crear(payload),
    onSuccess: (creado) => {
      queryClient.invalidateQueries({ queryKey: tributosQueryKeys.all(tipo) })
      toastSuccess(`${singular} ${creado.serie}-${creado.numero} creada; pendiente de emisión`)
    },
    onError: (error) => toastApiError(error, `No se pudo crear la ${singular.toLowerCase()}`),
  })
}

export function useEmitirTributoMutation(tipo: TipoTributo) {
  const queryClient = useQueryClient()
  const service = createTributoService(tipo)
  const { singular } = TRIBUTOS_CONFIG[tipo]
  return useMutation({
    mutationFn: (id: number) => service.emitir(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tributosQueryKeys.all(tipo) })
      const estado = (data.sunat.estado ?? '').toUpperCase()
      if (estado === 'ACEPTADO') toastSuccess(`${singular} aceptada por SUNAT`)
      else if (estado === 'PENDIENTE') toastWarning(`${singular} enviada; SUNAT aún no confirma (PENDIENTE)`)
      else toastError(`${singular}: ${estado || 'RECHAZADO'}`)
    },
    onError: (error) => toastApiError(error, `No se pudo emitir la ${singular.toLowerCase()}`),
  })
}
