import type { OrigenesElegiblesFilters, TipoTributo, TributoListFilters } from '../interfaces/tributo.interface'

export const tributosQueryKeys = {
  all: (tipo: TipoTributo) => [tipo === 'percepcion' ? 'percepciones' : 'retenciones'] as const,
  lists: (tipo: TipoTributo) => [...tributosQueryKeys.all(tipo), 'list'] as const,
  list: (tipo: TipoTributo, filters: TributoListFilters) => [...tributosQueryKeys.lists(tipo), filters] as const,
  details: (tipo: TipoTributo) => [...tributosQueryKeys.all(tipo), 'detail'] as const,
  detail: (tipo: TipoTributo, id: number) => [...tributosQueryKeys.details(tipo), id] as const,
  catalogos: (tipo: TipoTributo) => [...tributosQueryKeys.all(tipo), 'catalogos'] as const,
  elegibles: (tipo: TipoTributo, filters: OrigenesElegiblesFilters) =>
    [...tributosQueryKeys.all(tipo), 'elegibles', filters] as const,
}
