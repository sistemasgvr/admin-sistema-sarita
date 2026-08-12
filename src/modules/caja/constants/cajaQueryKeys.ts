import type { CajaSesionesListFilters, LibroDiarioFilters } from '@/modules/caja/interfaces/caja.interface'

export const cajaQueryKeys = {
  all: ['caja'] as const,
  dia: (fecha: string, idSucursal?: number | null) =>
    [...cajaQueryKeys.all, 'dia', fecha, idSucursal ?? null] as const,
  sesiones: (filters: CajaSesionesListFilters) =>
    [...cajaQueryKeys.all, 'sesiones', filters] as const,
  pendienteCierre: (idSucursal?: number | null) =>
    [...cajaQueryKeys.all, 'pendiente-cierre', idSucursal ?? null] as const,
  sesion: (id: number) => [...cajaQueryKeys.all, 'sesion', id] as const,
  libroDiario: (filters: LibroDiarioFilters) =>
    [...cajaQueryKeys.all, 'libro-diario', filters] as const,
}
