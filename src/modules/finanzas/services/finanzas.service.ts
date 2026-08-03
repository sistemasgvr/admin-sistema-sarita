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
}
