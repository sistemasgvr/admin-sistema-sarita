import { apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  ContadorNoLeidas,
  Notificacion,
  NotificacionListFilters,
} from '@/modules/notificaciones/interfaces/notificacion.interface'

export const notificacionesService = {
  listar(filters: NotificacionListFilters = {}) {
    return apiGetPaginated<Notificacion>('/notificaciones', { params: filters })
  },

  contarNoLeidas() {
    return apiGet<ContadorNoLeidas>('/notificaciones/no-leidas/contador')
  },

  marcarLeida(id: number) {
    return apiPatch<Notificacion>(`/notificaciones/${id}/leida`, {})
  },

  marcarTodasLeidas() {
    return apiPatch<{ actualizadas: number }>('/notificaciones/leidas/todas', {})
  },

  ejecutarJobAlquileresVencidos() {
    return apiPost<{
      alquileres: number
      destinatarios: number
      notificaciones: number
    }>('/notificaciones/jobs/alquileres-vencidos', {})
  },
}
