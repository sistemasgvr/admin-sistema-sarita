export interface TipoBalon {
  id: number
  nombre: string
  id_gas?: number | null
  nombre_gas?: string | null
  capacidad?: number | null
  id_unidad_medida?: number | null
  nombre_unidad_medida?: string | null
  peso?: number | null
  vigencia_ph_anios?: number | null
  estado: number
  total_balones?: number
  nombre_usuario_creacion?: string | null
  nombre_usuario_modificacion?: string | null
  codigo_gas?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export interface TipoBalonListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idGas?: number
}

export interface TipoBalonPayload {
  idUsuarioAuditoria: number
  nombre: string
  idGas?: number
  capacidad?: number
  idUnidadMedida?: number
  peso?: number
  vigenciaPhAnios?: number
}

export type CreateTipoBalonPayload = TipoBalonPayload
export type UpdateTipoBalonPayload = TipoBalonPayload

export interface DeleteTipoBalonResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type TipoBalonFormMode = 'create' | 'edit'
