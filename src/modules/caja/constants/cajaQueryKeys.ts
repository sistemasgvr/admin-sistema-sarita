import type { LibroDiarioFilters } from '@/modules/caja/interfaces/caja.interface'

export const cajaQueryKeys = {
  all: ['caja'] as const,
  dia: (fecha: string, idSucursal?: number | null) =>
    [...cajaQueryKeys.all, 'dia', fecha, idSucursal ?? null] as const,
  sesiones: (filters: Record<string, unknown>) =>
    [...cajaQueryKeys.all, 'sesiones', filters] as const,
  sesion: (id: number) => [...cajaQueryKeys.all, 'sesion', id] as const,
  libroDiario: (filters: LibroDiarioFilters) =>
    [...cajaQueryKeys.all, 'libro-diario', filters] as const,
}
