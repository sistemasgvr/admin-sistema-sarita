import type { ContactoListFilters } from '@/modules/contactos/interfaces/contacto.interface'

export const contactosQueryKeys = {
  all: ['contactos'] as const,
  lists: () => [...contactosQueryKeys.all, 'list'] as const,
  list: (filters: ContactoListFilters) =>
    [...contactosQueryKeys.lists(), filters] as const,
}
