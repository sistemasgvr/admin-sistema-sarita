import { computed, ref, type Ref } from 'vue'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/vue-query'
import { cajaQueryKeys } from '@/modules/caja/constants/cajaQueryKeys'
import { cajaService } from '@/modules/caja/services/caja.service'
import type {
  AbrirCajaPayload,
  CajaSesionesListFilters,
  CerrarCajaPayload,
  CrearCajaDepositoPayload,
  CrearCajaGastoPayload,
  CrearCajaObservacionPayload,
  LibroDiarioFilters,
} from '@/modules/caja/interfaces/caja.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

/** Invalidar día / libro diario tras ventas, cobranzas, gastos, depósitos, etc. */
export function invalidateCajaQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: cajaQueryKeys.all })
}

export function useCajaDiaQuery(fecha: Ref<string>, idSucursal: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => cajaQueryKeys.dia(fecha.value, idSucursal.value)),
    queryFn: () => cajaService.obtenerDia(fecha.value, idSucursal.value),
    enabled: computed(() => Boolean(fecha.value)),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}

export function useLibroDiarioQuery(filters: Ref<LibroDiarioFilters>) {
  return useQuery({
    queryKey: computed(() => cajaQueryKeys.libroDiario(filters.value)),
    queryFn: () => cajaService.libroDiario(filters.value),
    enabled: computed(() => Boolean(filters.value.fechaDesde)),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}

export function useAbrirCajaMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (payload: AbrirCajaPayload) =>
      cajaService.abrir({ ...payload, idUsuarioAuditoria: auth.user?.id }),
    onSuccess: () => invalidateCajaQueries(queryClient),
    onError: () => {
      /* El modal muestra el toast con contexto abrir/reabrir */
    },
  })
}

export function useCajaSesionesQuery(filters: Ref<CajaSesionesListFilters>) {
  return useQuery({
    queryKey: computed(() => cajaQueryKeys.sesiones(filters.value)),
    queryFn: () =>
      cajaService.listarSesiones({
        fechaDesde: filters.value.fechaDesde || undefined,
        fechaHasta: filters.value.fechaHasta || undefined,
        estadoCaja: filters.value.estadoCaja || undefined,
        idSucursal: filters.value.idSucursal ?? undefined,
        pagina: filters.value.pagina ?? 1,
        limite: filters.value.limite ?? 20,
      }),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useCajaPendienteCierreQuery(
  idSucursal: Ref<number | null | undefined> = ref(null),
) {
  return useQuery({
    queryKey: computed(() => cajaQueryKeys.pendienteCierre(idSucursal.value)),
    queryFn: () => cajaService.listarPendienteCierre(idSucursal.value),
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}

export function useCerrarCajaMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CerrarCajaPayload }) =>
      cajaService.cerrar(id, { ...payload, idUsuarioAuditoria: auth.user?.id }),
    onSuccess: () => invalidateCajaQueries(queryClient),
  })
}

export function useCrearCajaGastoMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (payload: CrearCajaGastoPayload) =>
      cajaService.crearGasto({ ...payload, idUsuarioAuditoria: auth.user?.id }),
    onSuccess: () => invalidateCajaQueries(queryClient),
  })
}

export function useCrearCajaDepositoMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (payload: CrearCajaDepositoPayload) =>
      cajaService.crearDeposito({ ...payload, idUsuarioAuditoria: auth.user?.id }),
    onSuccess: () => invalidateCajaQueries(queryClient),
  })
}

export function useCrearCajaObservacionMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (payload: CrearCajaObservacionPayload) =>
      cajaService.crearObservacion({ ...payload, idUsuarioAuditoria: auth.user?.id }),
    onSuccess: () => invalidateCajaQueries(queryClient),
  })
}

export function useEliminarCajaGastoMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (id: number) => cajaService.eliminarGasto(id, auth.user?.id),
    onSuccess: () => {
      void invalidateCajaQueries(queryClient)
      toastSuccess('Gasto anulado')
    },
    onError: (error) => toastApiError(error, 'No se pudo anular el gasto'),
  })
}

export function useEliminarCajaDepositoMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (id: number) => cajaService.eliminarDeposito(id, auth.user?.id),
    onSuccess: () => {
      void invalidateCajaQueries(queryClient)
      toastSuccess('Depósito anulado')
    },
    onError: (error) => toastApiError(error, 'No se pudo anular el depósito'),
  })
}

export function useEliminarCajaObservacionMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (id: number) => cajaService.eliminarObservacion(id, auth.user?.id),
    onSuccess: () => invalidateCajaQueries(queryClient),
  })
}
