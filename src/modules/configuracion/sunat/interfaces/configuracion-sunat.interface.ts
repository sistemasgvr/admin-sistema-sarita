export interface ConfiguracionSunat {
  id: number
  id_empresa: number
  nombre_comercial?: string
  ruc_empresa?: string | null
  usuario_sol: string
  clave_sol?: string | null
  certificado_digital?: string
  clave_certificado?: string | null
  tiene_clave_sol: boolean
  tiene_clave_certificado: boolean
  id_ambiente?: number
  nombre_ambiente?: string
  proveedor_pse?: string | null
  pse_habilitado?: boolean
  api_base_url?: string | null
  api_token?: string | null
  tiene_api_token?: boolean
  api_usuario?: string | null
  api_clave?: string | null
  tiene_api_clave?: boolean
  ruc_emisor?: string | null
  client_id?: string | null
  client_secret?: string | null
  tiene_client_secret?: boolean
  timeout_ms?: number | null
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
}

export interface ConfiguracionSunatListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idEmpresa?: number
}

export interface CreateConfiguracionSunatPayload {
  idEmpresa: number
  usuarioSol: string
  claveSol: string
  certificadoDigital?: string
  claveCertificado?: string
  idAmbiente?: number
  proveedorPse?: string
  pseHabilitado?: boolean
  apiBaseUrl?: string
  apiToken?: string
  apiUsuario?: string
  apiClave?: string
  rucEmisor?: string
  clientId?: string
  clientSecret?: string
  timeoutMs?: number
}

export interface UpdateConfiguracionSunatPayload {
  idEmpresa?: number
  usuarioSol?: string
  claveSol?: string
  certificadoDigital?: string
  claveCertificado?: string
  idAmbiente?: number
  proveedorPse?: string
  pseHabilitado?: boolean
  apiBaseUrl?: string
  apiToken?: string
  apiUsuario?: string
  apiClave?: string
  rucEmisor?: string
  clientId?: string
  clientSecret?: string
  timeoutMs?: number
}

export interface DeleteConfiguracionSunatResponse {
  eliminado: boolean
  id: number
}

export type ConfiguracionSunatFormMode = 'create' | 'edit'
