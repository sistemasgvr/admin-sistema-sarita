import { apiGetPaginated } from '@/shared/api/apiClient'
import type {
  PrestamoAntiguedadFilters,
  PrestamoAntiguedadItem,
} from '@/modules/balones/prestamos/interfaces/prestamo-antiguedad.interface'

export const prestamosAntiguedadService = {
  listar(filters: PrestamoAntiguedadFilters = {}) {
    return apiGetPaginated<PrestamoAntiguedadItem>('/balones/prestamos/reporte/antiguedad', {
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
