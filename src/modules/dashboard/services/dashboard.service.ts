import { apiGet } from '@/shared/api/apiClient'
import type {
  BalonesDashboard,
  ClientesDashboard,
} from '@/modules/dashboard/interfaces/dashboard.interface'

export interface ClientesDashboardParams {
  fechaDesde?: string
  fechaHasta?: string
  idCliente?: number
}

export const dashboardService = {
  clientes(params: ClientesDashboardParams = {}) {
    return apiGet<ClientesDashboard>('/dashboard/clientes', { params })
  },

  balones(diasAlerta = 30, idCliente?: number) {
    return apiGet<BalonesDashboard>('/dashboard/balones', {
      params: { diasAlerta, idCliente },
    })
  },
}
