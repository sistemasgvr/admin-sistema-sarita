export const rutasPueblosQueryKeys = {
  all: ['balones', 'rutas-pueblos'] as const,
  lists: () => [...rutasPueblosQueryKeys.all, 'list'] as const,
  list: (filters: unknown) => [...rutasPueblosQueryKeys.lists(), filters] as const,
  details: () => [...rutasPueblosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...rutasPueblosQueryKeys.details(), id] as const,
}
