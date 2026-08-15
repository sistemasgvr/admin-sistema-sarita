import { apiGet } from '@/shared/api/apiClient'
import type {
  DashboardBalonesBajasKpi,
  DashboardBalonesKpi,
  DashboardBalonesQueryParams,
  DashboardClientesKpi,
  DashboardClientesMoraKpi,
  DashboardClientesMoraQueryParams,
  DashboardClientesQueryParams,
  DashboardComprasNetasKpi,
  DashboardComprasNetasQueryParams,
  DashboardDemandaGasesKpi,
  DashboardDeudaKpi,
  DashboardDeudaQueryParams,
  DashboardGarantiasAlquilerKpi,
  DashboardGasesComparativoKpi,
  DashboardGasesComparativoQueryParams,
  DashboardHistoricoKpi,
  DashboardHistoricoQueryParams,
  DashboardIdAlmacenQueryParams,
  DashboardProductosKpi,
  DashboardRangoFechasQueryParams,
  DashboardRentabilidadKpi,
  DashboardStockCategoriaKpi,
  DashboardStockCriticoKpi,
  DashboardStockCriticoQueryParams,
  DashboardTopClientesVentaKpi,
  DashboardTopClientesVentaQueryParams,
  DashboardVelocidadSalidaKpi,
  DashboardVelocidadSalidaQueryParams,
  DashboardVentasNetasKpi,
  DashboardVentasNetasQueryParams,
} from '@/modules/dashboard/interfaces/dashboard.interface'

export type DashboardTipoDeuda = 'COBRAR' | 'PAGAR'

export const dashboardService = {
  kpiClientes(params: DashboardClientesQueryParams = {}) {
    return apiGet<DashboardClientesKpi>('/dashboard/clientes', { params })
  },

  kpiBalones(params: DashboardBalonesQueryParams = {}) {
    return apiGet<DashboardBalonesKpi>('/dashboard/balones', { params })
  },

  ventasNetas(params: DashboardVentasNetasQueryParams = {}) {
    return apiGet<DashboardVentasNetasKpi>('/dashboard/ventas', { params })
  },

  comprasNetas(params: DashboardComprasNetasQueryParams = {}) {
    return apiGet<DashboardComprasNetasKpi>('/dashboard/compras', { params })
  },

  deudaCuentas(tipo: DashboardTipoDeuda, params: DashboardDeudaQueryParams = {}) {
    const basePath = tipo === 'COBRAR' ? 'deudas/cobrar' : 'deudas/pagar'
    return apiGet<DashboardDeudaKpi>(`/dashboard/${basePath}`, { params })
  },

  creditosOtorgados(params: DashboardRangoFechasQueryParams = {}) {
    return apiGet<number>('/dashboard/deudas/creditos-otorgados', { params })
  },

  rentabilidad(params: DashboardRangoFechasQueryParams = {}) {
    return apiGet<DashboardRentabilidadKpi>('/dashboard/rentabilidad', { params })
  },

  historico(params: DashboardHistoricoQueryParams = {}) {
    return apiGet<DashboardHistoricoKpi>('/dashboard/historico', { params })
  },

  topClientesVenta(params: DashboardTopClientesVentaQueryParams = {}) {
    return apiGet<DashboardTopClientesVentaKpi>('/dashboard/ventas/top-clientes', { params })
  },

  demandaGases(params: DashboardRangoFechasQueryParams = {}) {
    return apiGet<DashboardDemandaGasesKpi>('/dashboard/ventas/demanda-gases', { params })
  },

  ventaGasesComparativo(params: DashboardGasesComparativoQueryParams = {}) {
    return apiGet<DashboardGasesComparativoKpi>('/dashboard/ventas/gases-comparativo', {
      params,
    })
  },

  clientesMora(params: DashboardClientesMoraQueryParams = {}) {
    return apiGet<DashboardClientesMoraKpi>('/dashboard/clientes/mora', { params })
  },

  balonesBajasSolicitadas() {
    return apiGet<DashboardBalonesBajasKpi>('/dashboard/balones/bajas-solicitadas')
  },

  garantiasAlquiler() {
    return apiGet<DashboardGarantiasAlquilerKpi>('/dashboard/garantias/alquiler')
  },

  kpiProductos(params: DashboardIdAlmacenQueryParams = {}) {
    return apiGet<DashboardProductosKpi>('/dashboard/productos', { params })
  },

  stockPorCategoria(params: DashboardIdAlmacenQueryParams = {}) {
    return apiGet<DashboardStockCategoriaKpi>('/dashboard/productos/stock-categoria', { params })
  },

  velocidadSalida(params: DashboardVelocidadSalidaQueryParams = {}) {
    return apiGet<DashboardVelocidadSalidaKpi>('/dashboard/productos/velocidad-salida', {
      params,
    })
  },

  stockCritico(params: DashboardStockCriticoQueryParams = {}) {
    return apiGet<DashboardStockCriticoKpi>('/dashboard/productos/stock-critico', { params })
  },
}