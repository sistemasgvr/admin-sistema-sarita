import { apiGetPaginated } from '@/shared/api/apiClient'
import type {
  BalonPropietarioItem,
  BalonPropietarioListFilters,
} from '@/modules/balones/propietario/interfaces/balon-propietario.interface'

export const balonesPropietarioService = {
  listar(filters: BalonPropietarioListFilters = {}) {
    return apiGetPaginated<BalonPropietarioItem>('/balones/reporte/propietario', {
      params: filters,
    })
  },
}
