export interface ConsultaDniData {
  success: boolean
  dni: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  codVerifica?: number
  codVerificaLetra?: string
}

export interface ConsultaRucData {
  ruc: string
  razonSocial: string
  nombreComercial?: string | null
  estado?: string | null
  condicion?: string | null
  direccion?: string | null
  departamento?: string | null
  provincia?: string | null
  distrito?: string | null
  ubigeo?: string | null
}
