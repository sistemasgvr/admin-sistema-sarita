import type { CuentaBancariaListFilters } from '@/modules/cuentas-bancarias/interfaces/cuenta-bancaria.interface'

export const cuentasBancariasQueryKeys = {
  all: ['cuentas-bancarias'] as const,
  lists: () => [...cuentasBancariasQueryKeys.all, 'list'] as const,
  list: (filters: CuentaBancariaListFilters) => [...cuentasBancariasQueryKeys.lists(), filters] as const,
  details: () => [...cuentasBancariasQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...cuentasBancariasQueryKeys.details(), id] as const,
}
