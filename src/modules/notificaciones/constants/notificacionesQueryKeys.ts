import type { NotificacionListFilters } from '@/modules/notificaciones/interfaces/notificacion.interface'

export const notificacionesQueryKeys = {
  all: ['notificaciones'] as const,
  lists: () => [...notificacionesQueryKeys.all, 'list'] as const,
  list: (filters: NotificacionListFilters) =>
    [...notificacionesQueryKeys.lists(), filters] as const,
  contador: () => [...notificacionesQueryKeys.all, 'contador'] as const,
}
