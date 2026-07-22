import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  Cliente,
  ClienteListFilters,
  ClienteMapa,
  ClienteMapaFilters,
  CreateClientePayload,
  DeleteClienteResponse,
  RestaurarClienteResponse,
  UpdateClientePayload,
  ValidarDocumentoFilters,
  ValidarDocumentoResponse,
} from '@/modules/clientes/interfaces/cliente.interface'

export const clientesService = {
  listar(filters: ClienteListFilters = {}) {
    return apiGetPaginated<Cliente>('/clientes', { params: filters })
  },

  listarMapa(filters: ClienteMapaFilters = {}) {
    const params: Record<string, string | number> = {
      pagina: filters.pagina ?? 1,
      limite: filters.limite ?? 500,
    }
    if (filters.buscar) params.buscar = filters.buscar
    if (filters.soloActivos != null) params.soloActivos = filters.soloActivos
    if (filters.filtroBalones) params.filtroBalones = filters.filtroBalones
    return apiGetPaginated<ClienteMapa>('/clientes/mapa', { params })
  },

  obtenerPorId(id: number) {
    return apiGet<Cliente>(`/clientes/${id}`)
  },

  crear(payload: CreateClientePayload) {
    return apiPost<Cliente>('/clientes', payload)
  },

  actualizar(id: number, payload: UpdateClientePayload) {
    return apiPatch<Cliente>(`/clientes/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteClienteResponse>(`/clientes/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },

  restaurar(id: number, idUsuarioAuditoria: number) {
    return apiPatch<RestaurarClienteResponse>(`/clientes/${id}/restaurar`, {
      idUsuarioAuditoria,
    })
  },

  validarDocumento(filters: ValidarDocumentoFilters) {
    return apiGet<ValidarDocumentoResponse>('/clientes/validar-documento', {
      params: filters,
    })
  },
}
