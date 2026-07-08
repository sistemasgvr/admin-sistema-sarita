export type EstadoAprobacionBaja = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export interface BajaSolicitud {
  id: number
  id_balon: number
  codigo_balon: string
  numero_serie?: string | null
  id_motivo_baja: number
  nombre_motivo_baja?: string | null
  fecha_baja?: string | null
  motivo_detalle?: string | null
  id_cliente_comprador?: number | null
  nombre_cliente_comprador?: string | null
  serie_comprobante?: string | null
  numero_comprobante?: string | null
  monto_venta?: number | null
  observacion?: string | null
  id_usuario_solicita?: number | null
  nombre_usuario_solicita?: string | null
  estado_aprobacion: EstadoAprobacionBaja
  fecha_creacion?: string | null
}

export interface BajaSolicitudListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface AprobarBajaPayload {
  idUsuarioAuditoria: number
  idUsuarioAutoriza: number
}

export interface RechazarBajaPayload {
  idUsuarioAuditoria: number
  idUsuarioAutoriza: number
  motivoRechazo?: string
}
