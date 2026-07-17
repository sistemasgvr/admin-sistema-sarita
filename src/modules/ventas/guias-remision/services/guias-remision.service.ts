import {
  apiDelete,
  apiGet,
  apiGetBlob,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateGuiaRemisionPayload,
  EmitirGuiaRemisionResponse,
  GuiaRemision,
  GuiaRemisionCatalogos,
  GuiaRemisionListFilters,
  GuiaRemisionListItem,
  SiguienteNumeroGuiaResponse,
  UpdateGuiaRemisionPayload,
} from '@/modules/ventas/guias-remision/interfaces/guia-remision.interface'

export const guiasRemisionService = {
  listar(filters: GuiaRemisionListFilters) {
    return apiGetPaginated<GuiaRemisionListItem>('/guias-remision', {
      params: filters,
    })
  },

  obtenerPorId(id: number) {
    return apiGet<GuiaRemision>(`/guias-remision/${id}`)
  },

  obtenerCatalogos() {
    return apiGet<GuiaRemisionCatalogos>('/guias-remision/catalogos')
  },

  obtenerSiguienteNumero(serie: string) {
    return apiGet<SiguienteNumeroGuiaResponse>('/guias-remision/siguiente-numero', {
      params: { serie },
    })
  },

  crear(payload: CreateGuiaRemisionPayload) {
    return apiPost<GuiaRemision>('/guias-remision', payload)
  },

  actualizar(id: number, payload: UpdateGuiaRemisionPayload) {
    return apiPatch<GuiaRemision>(`/guias-remision/${id}`, payload)
  },

  obtenerPdf(id: number) {
    return apiGetBlob(`/guias-remision/${id}/pdf`)
  },

  emitir(id: number, idUsuarioAuditoria: number) {
    return apiPost<EmitirGuiaRemisionResponse>(`/guias-remision/${id}/emitir`, {
      idUsuarioAuditoria,
    })
  },

  consultarEstado(id: number, idUsuarioAuditoria: number) {
    return apiPost<EmitirGuiaRemisionResponse>(
      `/guias-remision/${id}/consultar-estado`,
      { idUsuarioAuditoria },
    )
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<{ eliminado: boolean; id: number }>(`/guias-remision/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
