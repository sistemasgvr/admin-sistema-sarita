import type {
  DashboardBalonesQueryParams,
  DashboardClientesMoraQueryParams,
  DashboardClientesQueryParams,
  DashboardComprasNetasQueryParams,
  DashboardDeudaQueryParams,
  DashboardGasesComparativoQueryParams,
  DashboardHistoricoQueryParams,
  DashboardIdAlmacenQueryParams,
  DashboardRangoFechasQueryParams,
  DashboardStockCriticoQueryParams,
  DashboardTopClientesVentaQueryParams,
  DashboardVelocidadSalidaQueryParams,
  DashboardVentasNetasQueryParams,
} from '@/modules/dashboard/interfaces/dashboard.interface'

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  kpiClientes: (params: DashboardClientesQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'kpi-clientes', params] as const,
  kpiBalones: (params: DashboardBalonesQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'kpi-balones', params] as const,
  ventasNetas: (params: DashboardVentasNetasQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'ventas-netas', params] as const,
  comprasNetas: (params: DashboardComprasNetasQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'compras-netas', params] as const,
  deudaCuentas: (tipo: 'COBRAR' | 'PAGAR', params: DashboardDeudaQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'deuda-cuentas', tipo, params] as const,
  creditosOtorgados: (params: DashboardRangoFechasQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'creditos-otorgados', params] as const,
  rentabilidad: (params: DashboardRangoFechasQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'rentabilidad', params] as const,
  historico: (params: DashboardHistoricoQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'historico', params] as const,
  topClientesVenta: (params: DashboardTopClientesVentaQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'top-clientes-venta', params] as const,
  demandaGases: (params: DashboardRangoFechasQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'demanda-gases', params] as const,
  gasesComparativo: (params: DashboardGasesComparativoQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'gases-comparativo', params] as const,
  clientesMora: (params: DashboardClientesMoraQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'clientes-mora', params] as const,
  balonesBajasSolicitadas: () =>
    [...dashboardQueryKeys.all, 'balones-bajas-solicitadas'] as const,
  garantiasAlquiler: () => [...dashboardQueryKeys.all, 'garantias-alquiler'] as const,
  kpiProductos: (params: DashboardIdAlmacenQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'kpi-productos', params] as const,
  stockPorCategoria: (params: DashboardIdAlmacenQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'stock-categoria', params] as const,
  velocidadSalida: (params: DashboardVelocidadSalidaQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'velocidad-salida', params] as const,
  stockCritico: (params: DashboardStockCriticoQueryParams = {}) =>
    [...dashboardQueryKeys.all, 'stock-critico', params] as const,
}