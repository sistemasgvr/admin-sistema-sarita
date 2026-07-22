export type EstadoAprobacionBaja = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export interface BajaCliente {
  id: number
  tipo_solicitud: 'BAJA' | 'REACTIVACION'
  id_cliente: number
  cliente_razon_social?: string | null
  nombre_cliente?: string | null
  numero_documento?: string | null
  id_motivo_baja?: number | null
  nombre_motivo_baja?: string | null
  motivo_detalle?: string | null
  nombre_estado_aprobacion: EstadoAprobacionBaja
  id_usuario_solicita?: number | null
  nombre_usuario_solicita?: string | null
  fecha_creacion?: string | null
  fecha_modificacion?: string | null
}

export interface BajaClienteDetail extends BajaCliente {
  tipo_solicitud: 'BAJA' | 'REACTIVACION'
  //Datos del cliente
  cliente_razon_social?: string | null
  cliente_nombres?: string | null
  cliente_apellido_paterno?: string | null
  cliente_apellido_materno?: string | null
  cliente_numero_documento?: string | null
  cliente_direccion?: string | null
  cliente_telefono?: string | null
  cliente_email?: string | null
  //Datos de la solicitud de baja
  fecha_baja?: string | null
  id_usuario_autoriza?: number | null
  nombre_usuario_autoriza?: string | null
  fecha_autorizacion?: string | null
  id_estado_aprobacion?: number | null
  //Auditoria de las tablas
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
}

export interface BajaClienteListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  isActivos?: number
  idCliente?: number
  idEstadoAprobacion?: number
  tipoSolicitud?: string
}

export interface SolicitarReactivacionClientePayload {
  idCliente: number
  motivoDetalle?: string
  idUsuarioAuditoria: number
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
}
