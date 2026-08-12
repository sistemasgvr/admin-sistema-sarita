import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { invalidateCajaQueries } from '@/modules/caja/composables/useCajaQuery'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type {
  ActualizarCuentaPayload,
  CrearCuentaCuotasPayload,
  CrearCuentaPayload,
  RegistrarPagoPayload,
  TipoCuenta,
} from '@/modules/finanzas/interfaces/cuenta.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function useInvalidateCuentas(tipo: TipoCuenta) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: finanzasQueryKeys.cuentas(tipo) })
    queryClient.invalidateQueries({ queryKey: finanzasQueryKeys.resumen(tipo) })
    queryClient.invalidateQueries({ queryKey: finanzasQueryKeys.saldos(tipo) })
    void invalidateCajaQueries(queryClient)
  }
}

export function useCrearCuentaMutation(tipo: TipoCuenta) {
  const invalidate = useInvalidateCuentas(tipo)
  const exito =
    tipo === 'COBRAR'
      ? 'Cuenta por cobrar registrada correctamente'
      : 'Cuenta por pagar registrada correctamente'

  return useMutation({
    mutationFn: (payload: CrearCuentaPayload) => finanzasService.crearCuenta(tipo, payload),
    onSuccess: () => {
      invalidate()
      toastSuccess(exito)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la cuenta')
    },
  })
}

export function useCrearCuentaCuotasMutation(tipo: TipoCuenta) {
  const invalidate = useInvalidateCuentas(tipo)
  const exito =
    tipo === 'COBRAR'
      ? 'Plan de cuotas por cobrar creado correctamente'
      : 'Plan de cuotas por pagar creado correctamente'

  return useMutation({
    mutationFn: (payload: CrearCuentaCuotasPayload) =>
      finanzasService.crearCuentaCuotas(tipo, payload),
    onSuccess: () => {
      invalidate()
      toastSuccess(exito)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el plan de cuotas')
    },
  })
}

export function useRegistrarPagoMutation(tipo: TipoCuenta) {
  const invalidate = useInvalidateCuentas(tipo)
  const exito = tipo === 'COBRAR' ? 'Cobranza registrada correctamente' : 'Pago registrado correctamente'

  return useMutation({
    mutationFn: (payload: RegistrarPagoPayload) => finanzasService.registrarPago(tipo, payload),
    onSuccess: () => {
      invalidate()
      toastSuccess(exito)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el pago')
    },
  })
}

export function useActualizarCuentaMutation(tipo: TipoCuenta) {
  const invalidate = useInvalidateCuentas(tipo)

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarCuentaPayload }) =>
      finanzasService.actualizarCuenta(tipo, id, payload),
    onSuccess: () => {
      invalidate()
      toastSuccess('Cuenta actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la cuenta')
    },
  })
}

export function useEliminarCuentaMutation(tipo: TipoCuenta) {
  const invalidate = useInvalidateCuentas(tipo)

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria?: number }) =>
      finanzasService.eliminarCuenta(tipo, id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidate()
      toastSuccess('Cuenta eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la cuenta')
    },
  })
}

export function useAnularPagoMutation(tipo: TipoCuenta) {
  const invalidate = useInvalidateCuentas(tipo)

  return useMutation({
    mutationFn: ({ idPago, idUsuarioAuditoria }: { idPago: number; idUsuarioAuditoria?: number }) =>
      finanzasService.anularPago(tipo, idPago, idUsuarioAuditoria),
    onSuccess: () => {
      invalidate()
      toastSuccess('Pago anulado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo anular el pago')
    },
  })
}
