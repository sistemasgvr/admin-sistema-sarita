/**
 * Shape real que retorna el backend en GET /clientes y GET /clientes/{id}.
 * A diferencia del payload de creación/edición (camelCase, según el swagger
 * de POST/PATCH), la respuesta viene en snake_case e incluye los nombres ya
 * resueltos por los INNER JOIN de cada catálogo (nombre_tipo_cliente,
 * nombre_tipo_persona, etc.) y los datos de auditoría.
 */
export interface Cliente {
  id: number
  codigo_interno: string
  razon_social?: string | null
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
  /** 1 = activo, 0 = inactivo (no es boolean) */
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

/** Valor del select "Mostrar clientes" en el listado */
export type ClienteEstadoFiltro = 'activos' | 'inactivos' | 'ambos'

export interface ClienteListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  /** true = solo activos, false = solo inactivos, undefined = ambos */
  soloActivos?: boolean
  idTipoCliente?: number
}

/**
 * Payload de creación/edición: se mantiene camelCase porque así lo documenta
 * el swagger de POST /clientes y PATCH /clientes/{id}.
 */
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
  telefono?: string
  email?: string
  idDepartamento?: number
  idProvincia?: number
  idDistrito?: number
  idPais?: number
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

/**
 * NOTA: el endpoint /clientes/validar-documento no documenta el shape exacto
 * de una respuesta exitosa (solo se vio el 401 en el swagger). Se asume que
 * `data` trae un booleano indicando si el documento ya está registrado.
 * Ajustar `registrado` al nombre real del campo si difiere.
 */
export interface ValidarDocumentoResponse {
  registrado: boolean
}
