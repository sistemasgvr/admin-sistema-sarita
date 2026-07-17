export type EstadoAprobacionBaja = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export interface BajaCliente {
  id: number
  id_cliente: number
  cliente_razon_social?: string | null
  nombre_cliente?: string | null
  numero_documento?: string | null
  id_motivo_baja: number
  nombre_motivo_baja?: string | null
  motivo_detalle?: string | null
  nombre_estado_aprobacion: EstadoAprobacionBaja
  id_usuario_solicita?: number | null
  nombre_usuario_solicita?: string | null
  fecha_creacion?: string | null
  fecha_modificacion?: string | null
}

export interface BajaClienteDetail extends BajaCliente {
  cliente_razon_social?: string | null
  cliente_nombres?: string | null
  cliente_apellido_paterno?: string | null
  cliente_apellido_materno?: string | null
  cliente_direccion?: string | null
  cliente_telefono?: string | null
  cliente_email?: string | null
}

export interface BajaClienteListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  isActivos?: number
  idCliente?: number
  idEstadoAprobacion?: number
}

export interface SolicitarBajaClientePayload {
  idCliente: number
  idMotivoBaja: number
  motivoDetalle?: string
  idUsuarioAuditoria: number
}

export interface AprobarBajaClientePayload {
  idUsuarioAuditoria: number
}

export interface RechazarBajaClientePayload {
  idUsuarioAuditoria: number
  motivoRechazo?: string
}
