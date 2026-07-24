export type EstadoPh = 'VENCIDA' | 'POR_VENCER' | 'VIGENTE'
export type EstadoAprobacionBaja = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'REACTIVADA'

export type TipoEventoEstadoBalon =
  | 'SOLICITUD_BAJA'
  | 'BAJA_APROBADA'
  | 'BAJA_RECHAZADA'
  | 'REACTIVACION'

export interface BalonEstadoHistorial {
  id: number
  id_balon: number
  tipo_evento: TipoEventoEstadoBalon
  nombre_tipo_evento?: string | null
  id_baja?: number | null
  id_motivo_baja?: number | null
  nombre_motivo_baja?: string | null
  id_estado_anterior?: number | null
  nombre_estado_anterior?: string | null
  id_estado_nuevo?: number | null
  nombre_estado_nuevo?: string | null
  observacion?: string | null
  id_usuario?: number | null
  nombre_usuario?: string | null
  fecha_evento?: string | null
  fecha_creacion?: string | null
}

export interface BalonBaja {
  id: number
  id_balon: number
  id_motivo_baja: number
  nombre_motivo_baja?: string | null
  fecha_baja?: string | null
  motivo_detalle?: string | null
  id_cliente_comprador?: number | null
  nombre_cliente_comprador?: string | null
  id_comprobante_venta?: number | null
  serie_comprobante?: string | null
  numero_comprobante?: string | null
  monto_venta?: number | null
  id_movimiento?: number | null
  observacion?: string | null
  id_usuario_solicita?: number | null
  nombre_usuario_solicita?: string | null
  id_usuario_autoriza?: number | null
  nombre_usuario_autoriza?: string | null
  fecha_autorizacion?: string | null
  estado_aprobacion?: EstadoAprobacionBaja | null
}

export interface BalonPhHistorial {
  id: number
  id_balon: number
  fecha_prueba: string
  vigencia_anios: number
  fecha_proxima?: string | null
  id_organo_inspector?: number | null
  nombre_organo_inspector?: string | null
  organo_inspector_no_aplica?: boolean
  numero_certificado?: string | null
  id_mantenimiento?: number | null
  id_movimiento_recarga?: number | null
  es_vigente?: boolean
  observacion?: string | null
  fecha_creacion?: string | null
}

export interface Balon {
  id: number
  codigo_balon: string
  numero_serie?: string | null
  libro_cilindro?: string | null
  pagina_libro?: number | null
  fecha_registro?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  id_cliente_ubicacion?: number | null
  nombre_cliente_ubicacion?: string | null
  id_propietario?: number | null
  nombre_propietario?: string | null
  id_cliente_propietario?: number | null
  nombre_cliente_propietario?: string | null
  id_referencia?: number | null
  nombre_referencia?: string | null
  id_marca_cilindro?: number | null
  nombre_marca_cilindro?: string | null
  id_organo_inspector?: number | null
  nombre_organo_inspector?: string | null
  organo_inspector_no_aplica?: boolean
  id_planta?: number | null
  nombre_planta?: string | null
  id_tipo_balon?: number | null
  nombre_tipo_balon?: string | null
  capacidad?: number | null
  peso_tipo_balon?: number | null
  nombre_unidad_medida?: string | null
  vigencia_ph_tipo_anios?: number | null
  id_producto_gas?: number | null
  nombre_producto_gas?: string | null
  id_estado_balon?: number | null
  nombre_estado_balon?: string | null
  fecha_ultima_prueba_hidrostatica?: string | null
  vigencia_prueba_hidrostatica_anios?: number | null
  fecha_proxima_prueba_hidrostatica?: string | null
  estado_ph?: EstadoPh | null
  fecha_fabricacion?: string | null
  anio_fabricacion?: number | null
  mes_fabricacion?: number | null
  numero_recepcion?: string | null
  presion_actual?: number | null
  observacion?: string | null
  tiene_solicitud_baja_pendiente?: boolean
  tiene_baja_aprobada?: boolean
  /** false = no se puede borrar (historial/dependencias); usar Solicitar baja */
  puede_eliminar?: boolean
  baja?: BalonBaja | null
  estado: number
  nombre_usuario_creacion?: string | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export interface BalonListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idTipoBalon?: number
  idAlmacen?: number
  idEstadoBalon?: number
  idClienteUbicacion?: number
  /** Prestado (ubicación) o propio del cliente (propietario). */
  idClienteRelacionado?: number
  idMarcaCilindro?: number
  phVencida?: boolean
  phPorVencerDias?: number
  /** true = historial de dados de baja/robados */
  soloBajas?: boolean
}

export interface BalonPayload {
  idUsuarioAuditoria: number
  codigoBalon: string
  libroCilindro?: string
  paginaLibro?: number
  fechaRegistro?: string
  idAlmacen?: number
  idClienteUbicacion?: number
  idPropietario?: number
  idClientePropietario?: number
  idReferencia?: number
  idTipoBalon?: number
  idProductoGas?: number
  idEstadoBalon?: number
  fechaUltimaPruebaHidrostatica?: string
  vigenciaPruebaHidrostaticaAnios?: number
  fechaProximaPruebaHidrostatica?: string
  fechaFabricacion?: string
  numeroRecepcion?: string
  presionActual?: number
  observacion?: string
  numeroSerie?: string
  idMarcaCilindro?: number
  idOrganoInspector?: number
  organoInspectorNoAplica?: boolean
  anioFabricacion?: number
  mesFabricacion?: number
  idPlanta?: number
}

export type CreateBalonPayload = BalonPayload
export type UpdateBalonPayload = BalonPayload

export interface RegistrarPhHistorialPayload {
  idUsuarioAuditoria: number
  fechaPrueba: string
  vigenciaAnios?: number
  idOrganoInspector?: number
  organoInspectorNoAplica?: boolean
  numeroCertificado?: string
  idMantenimiento?: number
  idMovimientoRecarga?: number
  observacion?: string
}

export interface SolicitarBajaBalonPayload {
  idUsuarioAuditoria: number
  idMotivoBaja: number
  idUsuarioSolicita: number
  motivoDetalle?: string
  idClienteComprador?: number
  idComprobanteVenta?: number
  serieComprobante?: string
  numeroComprobante?: string
  montoVenta?: number
  observacion?: string
  fechaBaja?: string
}

/** @deprecated Usar SolicitarBajaBalonPayload */
export type DarBajaBalonPayload = SolicitarBajaBalonPayload

export interface DeleteBalonResponse {
  eliminado: boolean
  id: number
  error?: string
}

export interface RestaurarBalonPayload {
  idUsuarioAuditoria: number
  observacion?: string
  idAlmacen?: number
}

export type BalonFormMode = 'create' | 'edit'

export interface BalonFormPreset {
  codigoBalon?: string
  idClienteUbicacion?: number
  idClientePropietario?: number
  idPropietario?: number
  idAlmacen?: number
  idEstadoBalon?: number
}
