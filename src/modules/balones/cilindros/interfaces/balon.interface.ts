export interface Balon {
  id: number
  codigo_balon: string
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
  id_tipo_balon?: number | null
  nombre_tipo_balon?: string | null
  id_producto_gas?: number | null
  nombre_producto_gas?: string | null
  id_estado_balon?: number | null
  nombre_estado_balon?: string | null
  fecha_ultima_prueba_hidrostatica?: string | null
  vigencia_prueba_hidrostatica_anios?: number | null
  fecha_proxima_prueba_hidrostatica?: string | null
  fecha_fabricacion?: string | null
  numero_recepcion?: string | null
  presion_actual?: number | null
  observacion?: string | null
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
}

export type CreateBalonPayload = BalonPayload
export type UpdateBalonPayload = BalonPayload

export interface DeleteBalonResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type BalonFormMode = 'create' | 'edit'
