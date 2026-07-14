export interface Cliente {
  id: number
  codigo_interno: string
  razon_social?: string | null
  nombre_comercial?: string | null
  id_tipo_cliente: number
  nombre_tipo_cliente?: string | null
  id_tipo_persona: number
  nombre_tipo_persona?: string | null
  nombres?: string | null
  apellido_paterno?: string | null
  apellido_materno?: string | null
  id_tipo_documento: number
  nombre_tipo_documento?: string | null
  numero_documento: string
  direccion?: string | null
  referencia?: string | null
  latitud?: number | null
  longitud?: number | null
  telefono?: string | null
  email?: string | null
  id_departamento?: number | null
  nombre_departamento?: string | null
  id_provincia?: number | null
  nombre_provincia?: string | null
  id_distrito?: number | null
  nombre_distrito?: string | null
  id_pais?: number | null
  nombre_pais?: string | null
  es_agente_percepcion: boolean
  es_buen_contribuyente: boolean
  es_agente_retenedor: boolean
  afecto_rus: boolean
  situacion_sunat?: string | null
  estado_contribuyente_sunat?: string | null
  observacion?: string | null
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export type ClienteEstadoFiltro = 'activos' | 'inactivos' | 'todos'

export interface ClienteListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  soloActivos?: number | null
  idTipoCliente?: number
}

export interface ClientePayload {
  idUsuarioAuditoria: number
  codigoInterno?: string
  razonSocial?: string
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  idTipoCliente: number
  idTipoPersona: number
  idTipoDocumento: number
  numeroDocumento: string
  direccion?: string
  referencia?: string
  latitud?: number | null
  longitud?: number | null
  telefono?: string
  email?: string
  idPais?: number
  idDepartamento?: number
  idProvincia?: number
  idDistrito?: number
  esAgentePercepcion?: boolean
  esBuenContribuyente?: boolean
  esAgenteRetenedor?: boolean
  afectoRus?: boolean
  situacionSunat?: string
  estadoContribuyenteSunat?: string
  observacion?: string
}

export type CreateClientePayload = ClientePayload
export type UpdateClientePayload = ClientePayload

export interface DeleteClienteResponse {
  eliminado: boolean
  id: number
}

export interface RestaurarClienteResponse {
  restaurado: boolean
  id: number
}

export type ClienteFormMode = 'create' | 'edit'

export interface ValidarDocumentoFilters {
  numeroDocumento: string
  idExcluir?: number
}

export interface ValidarDocumentoResponse {
  existe: boolean
}
