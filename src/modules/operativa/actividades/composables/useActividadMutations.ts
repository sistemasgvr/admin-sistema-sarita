import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { actividadesQueryKeys } from '@/modules/operativa/actividades/constants/actividadesQueryKeys'
import { comprobantesQueryKeys } from '@/modules/ventas/comprobantes/constants/comprobantesQueryKeys'
import { actividadesService } from '@/modules/operativa/actividades/services/actividades.service'
import type {
  CrearRecojoOrigenPayload,
  CrearRecojoPrestamoPayload,
  GenerarRecojosPayload,
  VerificarActividadPayload,
  CreateActividadPayload,
  UpdateActividadPayload,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { toastApiError, toastInfo, toastSuccess, toastWarning } from '@/shared/composables/useToast'

export function useCreateActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateActividadPayload) => actividadesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Actividad creada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la actividad')
    },
  })
}

export function useUpdateActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateActividadPayload }) =>
      actividadesService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Actividad actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la actividad')
    },
  })
}

export function useCancelarActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      actividadesService.cancelar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Reparto cancelado. El comprobante quedó disponible.')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo cancelar la actividad')
    },
  })
}

export function useMarcarActividadRealizadaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      actividadesService.marcarComoRealizada(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Actividad marcada como realizada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo marcar la actividad como realizada')
    },
  })
}

export function useDeleteActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      actividadesService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Actividad eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la actividad')
    },
  })
}

export function useAsignarResponsableActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idUsuarioAuditoria,
      idTrabajadorResponsable,
      idTrabajadorApoyo,
      liberar,
    }: {
      id: number
      idUsuarioAuditoria: number
      idTrabajadorResponsable?: number | null
      idTrabajadorApoyo?: number | null
      liberar?: boolean
    }) =>
      actividadesService.asignarResponsable(id, {
        idUsuarioAuditoria,
        idTrabajadorResponsable,
        idTrabajadorApoyo,
        liberar,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Responsable actualizado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el responsable de la actividad')
    },
  })
}

export function useVerificarActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VerificarActividadPayload }) =>
      actividadesService.verificar(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.detail(variables.id) })

      const momento = data.momento === 'SALIDA' ? 'salida' : 'llegada'
      const soloDesmarcar = variables.payload.lecturas.every((l) => l.pendiente)
      if (data.noPertenecen > 0) {
        toastWarning(
          `${data.coincidencias} verificado(s) en ${momento}; ${data.noPertenecen} código(s) no pertenecen a esta actividad`,
        )
      } else if (soloDesmarcar) {
        // Silencioso: el badge de la fila ya refleja Pendiente.
      } else if (data.completo) {
        toastSuccess(`Verificación de ${momento} completa`)
      }
      // Checks parciales: sin toast (el resumen del modal basta).
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la verificación')
    },
  })
}

export function useGenerarRecojosMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: GenerarRecojosPayload) => actividadesService.generarRecojos(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      if (data.creadas === 0) {
        toastInfo(
          data.yaExistian > 0
            ? 'Todos los préstamos por vencer ya tienen su recojo programado'
            : 'No hay préstamos vencidos ni por vencer en la ventana indicada',
        )
      } else {
        toastSuccess(
          data.creadas === 1
            ? '1 recojo programado'
            : `${data.creadas} recojos programados`,
        )
      }
    },
    onError: (error) => {
      toastApiError(error, 'No se pudieron generar los recojos')
    },
  })
}

export function useCrearRecojoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CrearRecojoOrigenPayload) =>
      actividadesService.crearRecojo(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      toastSuccess(
        data.creada
          ? 'Recojo programado correctamente'
          : 'Este origen ya tenía un recojo pendiente',
      )
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo programar el recojo')
    },
  })
}

export function useCrearRecojoPrestamoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CrearRecojoPrestamoPayload) =>
      actividadesService.crearRecojoPrestamo(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      toastSuccess(
        data.creada
          ? 'Recojo programado correctamente'
          : 'Este préstamo ya tenía un recojo pendiente',
      )
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo programar el recojo')
    },
  })
}

export function useIniciarEntregaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idUsuarioAuditoria,
    }: {
      id: number
      idUsuarioAuditoria?: number
    }) => actividadesService.iniciarEntrega(id, idUsuarioAuditoria),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.detail(variables.id) })
      toastSuccess('Entrega iniciada: la actividad quedó en ruta')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo iniciar la entrega')
    },
  })
}

export function useCulminarEntregaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idUsuarioAuditoria,
    }: {
      id: number
      idUsuarioAuditoria?: number
    }) => actividadesService.culminarEntrega(id, idUsuarioAuditoria),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      toastSuccess('Entrega culminada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo culminar la entrega')
    },
  })
}

export function useIniciarRecojoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idUsuarioAuditoria,
    }: {
      id: number
      idUsuarioAuditoria?: number
    }) => actividadesService.iniciarRecojo(id, idUsuarioAuditoria),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.detail(variables.id) })
      toastSuccess('Recojo iniciado: la actividad quedó en ruta')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo iniciar el recojo')
    },
  })
}

export function useCulminarRecojoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idAlmacenDestino,
      idUsuarioAuditoria,
    }: {
      id: number
      idAlmacenDestino: number
      idUsuarioAuditoria?: number
    }) =>
      actividadesService.culminarRecojo(id, {
        idAlmacenDestino,
        idUsuarioAuditoria,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.detail(variables.id) })
      toastSuccess('Recojo culminado: los cilindros ingresaron al almacén')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo culminar el recojo')
    },
  })
}

export function useIniciarVerificacionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idUsuarioAuditoria,
    }: {
      id: number
      idUsuarioAuditoria?: number
    }) => actividadesService.iniciarVerificacion(id, idUsuarioAuditoria),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.detail(variables.id) })
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo iniciar la verificación')
    },
  })
}
