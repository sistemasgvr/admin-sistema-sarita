import { apiGetPaginated } from '@/shared/api/apiClient'
import type {
  AlquilerAntiguedadFilters,
  AlquilerAntiguedadItem,
} from '@/modules/balones/alquileres/interfaces/alquiler-antiguedad.interface'

export const alquileresAntiguedadService = {
  listar(filters: AlquilerAntiguedadFilters = {}) {
    return apiGetPaginated<AlquilerAntiguedadItem>('/balones/alquileres/reporte/antiguedad', {
      params: {
        buscar: filters.buscar,
        pagina: filters.pagina,
        limite: filters.limite,
        idCliente: filters.idCliente,
        rangoDias: filters.rangoDias,
        excluirBajas: filters.excluirBajas,
        soloPendientes: filters.soloPendientes,
      },
    })
  },
}
