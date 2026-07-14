import type { ContactoListFilters } from '@/modules/contactos/interfaces/contacto.interface'

export const contactosQueryKeys = {
  all: ['contactos'] as const,
  lists: () => [...contactosQueryKeys.all, 'list'] as const,
  list: (filters: ContactoListFilters) =>
    [...contactosQueryKeys.lists(), filters] as const,
  details: () => [...contactosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...contactosQueryKeys.details(), id] as const,
}