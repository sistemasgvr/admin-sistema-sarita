import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  ActualizarCuentaPayload,
  CrearCuentaCuotasPayload,
  CrearCuentaPayload,
  CuentaFinanciera,
  CuentaFinancieraDetalle,
  CuentaListFilters,
  MedioPago,
  RegistrarPagoPayload,
  ResumenCuentas,
  TipoCuenta,
} from '@/modules/finanzas/interfaces/cuenta.interface'
import type {
  ActualizarGarantiaPayload,
  CrearGarantiaPayload,
  DuplicadoPagoInfo,
  Garantia,
  GarantiaListFilters,
  ReembolsarGarantiaPayload,
  VerificarDuplicadoPagoPayload,
} from '@/modules/finanzas/interfaces/garantia.interface'

const basePath = (tipo: TipoCuenta) =>
  tipo === 'COBRAR' ? '/finanzas/cuentas-por-cobrar' : '/finanzas/cuentas-por-pagar'

export const finanzasService = {
  listarCuentas(tipo: TipoCuenta, filters: CuentaListFilters = {}) {
    return apiGetPaginated<CuentaFinanciera>(basePath(tipo), { params: filters })
  },

  obtenerCuenta(tipo: TipoCuenta, id: number) {
    return apiGet<CuentaFinancieraDetalle>(`${basePath(tipo)}/${id}`)
  },

  resumen(tipo: TipoCuenta) {
    return apiGet<ResumenCuentas>(`${basePath(tipo)}/resumen`)
  },

  crearCuenta(tipo: TipoCuenta, payload: CrearCuentaPayload) {
    return apiPost<CuentaFinanciera>(basePath(tipo), payload)
  },

  crearCuentaCuotas(tipo: TipoCuenta, payload: CrearCuentaCuotasPayload) {
    return apiPost<CuentaFinancieraDetalle>(`${basePath(tipo)}/plan-cuotas`, payload)
  },

  actualizarCuenta(tipo: TipoCuenta, id: number, payload: ActualizarCuentaPayload) {
    return apiPatch<CuentaFinanciera>(`${basePath(tipo)}/${id}`, payload)
  },

  eliminarCuenta(tipo: TipoCuenta, id: number, idUsuarioAuditoria?: number) {
    return apiDelete(`${basePath(tipo)}/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },

  registrarPago(tipo: TipoCuenta, payload: RegistrarPagoPayload) {
    return apiPost(`${basePath(tipo)}/pagos`, payload)
  },

  anularPago(tipo: TipoCuenta, idPago: number, idUsuarioAuditoria?: number) {
    return apiPatch(`${basePath(tipo)}/pagos/${idPago}/anular`, { idUsuarioAuditoria })
  },

  mediosPago() {
    return apiGet<MedioPago[]>('/finanzas/medios-pago')
  },

  verificarDuplicadoPago(payload: VerificarDuplicadoPagoPayload) {
    return apiPost<DuplicadoPagoInfo>('/finanzas/verificar-duplicado-pago', payload)
  },

  /* -------- Garantías -------- */
  listarGarantias(filters: GarantiaListFilters = {}) {
    return apiGetPaginated<Garantia>('/finanzas/garantias', { params: filters })
  },
  crearGarantia(payload: CrearGarantiaPayload) {
    return apiPost<Garantia>('/finanzas/garantias', payload)
  },
  actualizarGarantia(id: number, payload: ActualizarGarantiaPayload) {
    return apiPatch<Garantia>(`/finanzas/garantias/${id}`, payload)
  },
  eliminarGarantia(id: number, idUsuarioAuditoria?: number) {
    return apiDelete(`/finanzas/garantias/${id}`, { data: { idUsuarioAuditoria } })
  },
  reembolsarGarantia(id: number, payload: ReembolsarGarantiaPayload) {
    return apiPost<Garantia>(`/finanzas/garantias/${id}/reembolsar`, payload)
  },
  anularReembolsoGarantia(id: number, idUsuarioAuditoria?: number) {
    return apiPatch<Garantia>(`/finanzas/garantias/${id}/anular-reembolso`, { idUsuarioAuditoria })
  },
}
