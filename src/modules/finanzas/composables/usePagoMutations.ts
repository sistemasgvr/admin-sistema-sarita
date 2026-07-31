import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type {
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
