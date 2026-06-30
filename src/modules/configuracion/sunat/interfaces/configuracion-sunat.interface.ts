export interface ConfiguracionSunat {
  id: number
  id_empresa: number
  nombre_comercial?: string
  usuario_sol: string
  certificado_digital?: string
  tiene_clave_sol: boolean
  tiene_clave_certificado: boolean
  id_ambiente?: number
  nombre_ambiente?: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
}

export interface ConfiguracionSunatListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface CreateConfiguracionSunatPayload {
  idEmpresa: number
  usuarioSol: string
  claveSol: string
  certificadoDigital?: string
  claveCertificado?: string
  idAmbiente?: number
}

export interface UpdateConfiguracionSunatPayload {
  idEmpresa?: number
  usuarioSol?: string
  claveSol?: string
  certificadoDigital?: string
  claveCertificado?: string
  idAmbiente?: number
}

export interface DeleteConfiguracionSunatResponse {
  eliminado: boolean
  id: number
}

export type ConfiguracionSunatFormMode = 'create' | 'edit'
