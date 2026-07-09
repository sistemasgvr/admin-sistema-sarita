export interface Vehiculo {
  id: number
  id_cliente?: number | null
  cliente_razon_social?: string | null
  cliente_nombres?: string | null
  cliente_apellido_paterno?: string | null
  cliente_apellido_materno?: string | null
  cliente_numero_documento?: string | null
  id_tipo_vehiculo: number
  nombre_tipo_vehiculo?: string | null
  placa: string
  placa2?: string | null
  marca?: string | null
  marca2?: string | null
  modelo?: string | null
  anio?: number | null
  color?: string | null
  certificado_inscripcion?: string | null
  certificado2?: string | null
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export type VehiculoEstadoFiltro = 'activos' | 'inactivos' | 'todos'

export interface VehiculoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  isActivos?: number | null
  idCliente?: number
}

export interface VehiculoPayload {
  idUsuarioAuditoria: number
  idCliente?: number
  idTipoVehiculo: number
  placa: string
  placa2?: string
  marca?: string
  marca2?: string
  modelo?: string
  anio?: number
  color?: string
  certificadoInscripcion?: string
  certificado2?: string
}

export type CreateVehiculoPayload = VehiculoPayload
export type UpdateVehiculoPayload = VehiculoPayload

export interface DeleteVehiculoResponse {
  eliminado: boolean
  id: number
}

export type VehiculoFormMode = 'create' | 'edit'
