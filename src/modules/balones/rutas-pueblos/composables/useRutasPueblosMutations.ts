import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { rutasPueblosQueryKeys } from '@/modules/balones/rutas-pueblos/constants/rutasPueblosQueryKeys'
import type {
  CerrarRutaPuebloPayload,
  CreateRutaPuebloPayload,
  RegistrarRetornoRutaPuebloPayload,
  UpdateRutaPuebloPayload,
} from '@/modules/balones/rutas-pueblos/interfaces/ruta-pueblo.interface'
import { rutasPueblosService } from '@/modules/balones/rutas-pueblos/services/rutas-pueblos.service'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: number) {
  queryClient.invalidateQueries({ queryKey: rutasPueblosQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
  if (id) {
    queryClient.invalidateQueries({ queryKey: rutasPueblosQueryKeys.detail(id) })
  }
}

export function useCreateRutaPuebloMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRutaPuebloPayload) => rutasPueblosService.crear(payload),
    onSuccess: () => {
      invalidate(queryClient)
      toastSuccess('Ruta creada (ABIERTA)')
    },
    onError: (error) => toastApiError(error, 'No se pudo crear la ruta'),
  })
}

export function useUpdateRutaPuebloMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRutaPuebloPayload }) =>
      rutasPueblosService.actualizar(id, payload),
    onSuccess: (_d, v) => {
      invalidate(queryClient, v.id)
      toastSuccess('Ruta actualizada')
    },
    onError: (error) => toastApiError(error, 'No se pudo actualizar la ruta'),
  })
}

export function useIniciarRutaPuebloMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      rutasPueblosService.iniciar(id, idUsuarioAuditoria),
    onSuccess: (_d, v) => {
      invalidate(queryClient, v.id)
      toastSuccess('Ruta iniciada · cilindros en tránsito')
    },
    onError: (error) => toastApiError(error, 'No se pudo iniciar la ruta'),
  })
}

export function useRegistrarRetornoRutaPuebloMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: RegistrarRetornoRutaPuebloPayload
    }) => rutasPueblosService.registrarRetorno(id, payload),
    onSuccess: (_d, v) => {
      invalidate(queryClient, v.id)
      toastSuccess('Retorno registrado · residual actualizado')
    },
    onError: (error) => toastApiError(error, 'No se pudo registrar el retorno'),
  })
}

export function useCerrarRutaPuebloMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CerrarRutaPuebloPayload }) =>
      rutasPueblosService.cerrar(id, payload),
    onSuccess: (data, v) => {
      invalidate(queryClient, v.id)
      const descuadre = Number(data.descuadre_m3 ?? 0)
      const tol = Number(data.tolerancia_m3 ?? 0.5)
      if (Math.abs(descuadre) > tol) {
        toastWarning(
          `Ruta cerrada con descuadre de ${descuadre.toFixed(3)} m³ (tol. ±${tol})`,
        )
      } else {
        toastSuccess('Ruta cerrada · cuadre OK')
      }
    },
    onError: (error) => toastApiError(error, 'No se pudo cerrar la ruta'),
  })
}

export function useDeleteRutaPuebloMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      rutasPueblosService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidate(queryClient)
      toastSuccess('Ruta eliminada')
    },
    onError: (error) => toastApiError(error, 'No se pudo eliminar la ruta'),
  })
}
