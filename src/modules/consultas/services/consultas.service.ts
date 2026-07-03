import { apiGet } from '@/shared/api/apiClient'
import type {
  ConsultaDniData,
  ConsultaRucData,
} from '@/modules/consultas/interfaces/consulta.interface'

export const consultasService = {
  consultarDni(dni: string) {
    return apiGet<ConsultaDniData>(`/consultas/dni/${dni}`)
  },

  consultarRuc(ruc: string) {
    return apiGet<ConsultaRucData>(`/consultas/ruc/${ruc}`)
  },
}
