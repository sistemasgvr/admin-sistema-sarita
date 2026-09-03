// Espejo de api-sistema-sarita/src/modules/documentos-salida/interfaces/documento-salida.interface.ts

export type CodigoTipoOrdenSalida =
  | 'ORDEN_SALIDA_VENTA'
  | 'ORDEN_SALIDA_INTERNA'
  | 'RECARGA_PLANTA_EXTERNA'
  | 'RETORNO_PLANTA_EXTERNA'
  | 'TRASLADO'

export type NombreEstadoCicloSalida = 'BORRADOR' | 'GENERADA' | 'EMITIDA_SUNAT' | 'ANULADA'

export interface DocumentoSalidaDetalle {
  id: number
  item: number
  id_producto: number | null
  codigo_producto: string | null
  descripcion: string | null
  id_balon: number | null
  codigo_balon: string | null
  cantidad: number
  id_unidad_medida: number | null
  nombre_unidad_medida: string | null
  codigo_unidad_medida: string | null
  nombre_producto: string | null
  glosa: string | null
  id_movimiento: number | null
  origen_detalle: 'VENTA' | 'PROPIO'
}

export interface DocumentoSalidaReferencia {
  id: number
  id_tipo_comprobante: number | null
  nombre_tipo_comprobante: string | null
  codigo_tipo_comprobante: string | null
  id_comprobante: number | null
  serie: string | null
  numero: string | null
  fecha: string | null
}

export interface DocumentoSalida {
  id: number
  numero: string
  id_tipo_orden: number
  nombre_tipo_orden: CodigoTipoOrdenSalida
  id_estado_ciclo: number
  nombre_estado_ciclo: NombreEstadoCicloSalida
  emitido_sunat: boolean
  id_venta: number | null
  serie_venta: string | null
  numero_venta: string | null
  id_doc_salida_origen: number | null
  id_sucursal: number
  nombre_sucursal: string | null
  id_almacen: number
  nombre_almacen: string | null
  id_cliente: number | null
  nombre_cliente: string | null
  id_destinatario: number | null
  destinatario_nombre: string | null
  destinatario_documento: string | null
  nombre_destinatario: string | null
  documento_destinatario: string | null
  id_proveedor: number | null
  nombre_proveedor: string | null
  fecha: string
  fecha_traslado: string | null
  fecha_retorno: string | null
  id_tipo_guia_remision: number | null
  nombre_tipo_guia_remision: string | null
  codigo_tipo_guia: string | null
  serie: string | null
  numero_sunat: string | null
  id_estado_sunat: number | null
  nombre_estado_sunat: string | null
  ticket_sunat: string | null
  hash_documento: string | null
  id_motivo_traslado: number | null
  nombre_motivo_traslado: string | null
  id_modalidad_traslado: number | null
  nombre_modalidad_traslado: string | null
  id_unidad_medida: number | null
  nombre_unidad_medida: string | null
  peso_bruto: number | null
  numero_bultos: number | null
  direccion_origen: string | null
  id_distrito_origen: number | null
  ubigeo_origen: string | null
  id_provincia_origen: number | null
  id_departamento_origen: number | null
  id_pais_origen: number | null
  direccion_llegada: string | null
  id_distrito_llegada: number | null
  ubigeo_llegada: string | null
  id_provincia_llegada: number | null
  id_departamento_llegada: number | null
  id_pais_llegada: number | null
  direccion_entrega: string | null
  referencia_entrega: string | null
  latitud: number | null
  longitud: number | null
  id_distrito_entrega: number | null
  nombre_distrito_entrega: string | null
  ubigeo_entrega: string | null
  id_provincia_entrega: number | null
  id_departamento_entrega: number | null
  id_pais_entrega: number | null
  id_direccion_cliente: number | null
  id_transportista: number | null
  nombre_transportista: string | null
  id_chofer: number | null
  nombre_chofer: string | null
  id_vehiculo: number | null
  placa_vehiculo: string | null
  id_responsable: number | null
  id_comprobante_compra: number | null
  serie_guia_salida: string | null
  numero_guia_salida: string | null
  serie_guia_ingreso: string | null
  numero_guia_ingreso: string | null
  serie_factura: string | null
  numero_factura: string | null
  fecha_llegada_almacen: string | null
  lote: string | null
  fecha_vencimiento_lote: string | null
  fecha_prueba_hidrostatica: string | null
  observaciones: string | null
  estado: number
  fecha_creacion: string
  fecha_modificacion: string | null
  nombre_usuario_creacion: string | null
  detalle_desde_venta: boolean
  venta_anulada: boolean
  detalle: DocumentoSalidaDetalle[]
  referencias: DocumentoSalidaReferencia[]
}

export interface DocumentoSalidaListItem {
  id: number
  numero: string
  id_tipo_orden: number
  nombre_tipo_orden: CodigoTipoOrdenSalida
  id_estado_ciclo: number
  nombre_estado_ciclo: NombreEstadoCicloSalida
  emitido_sunat: boolean
  serie: string | null
  numero_sunat: string | null
  id_estado_sunat: number | null
  nombre_estado_sunat: string | null
  id_venta: number | null
  serie_venta: string | null
  numero_venta: string | null
  fecha: string
  fecha_traslado: string | null
  fecha_llegada_almacen: string | null
  id_sucursal: number
  nombre_sucursal: string | null
  id_almacen: number
  nombre_almacen: string | null
  id_cliente: number | null
  nombre_cliente: string | null
  id_proveedor: number | null
  nombre_proveedor: string | null
  id_comprobante_compra: number | null
  lote: string | null
  observaciones: string | null
  detalle_desde_venta: boolean
  total_items: number
  fecha_creacion: string
}

export interface DocumentoSalidaListResumen {
  total: number
  borrador: number
  generada: number
  emitida_sunat: number
  anulada: number
}

export interface DocumentoSalidaListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idTipoOrden?: number
  codigoTipoOrden?: CodigoTipoOrdenSalida
  idEstadoCiclo?: number
  idSucursal?: number
  idAlmacen?: number
  idCliente?: number
  emitidoSunat?: boolean
  fechaDesde?: string
  fechaHasta?: string
}

export interface ListaOpcionBasica {
  id: number
  nombre: string
  descripcion: string | null
}

export interface DocumentoSalidaCatalogos {
  tiposOrden: ListaOpcionBasica[]
  estadosCiclo: ListaOpcionBasica[]
  tiposGuia: ListaOpcionBasica[]
  modalidadesTraslado: ListaOpcionBasica[]
  motivosTraslado: ListaOpcionBasica[]
  estadosSunat: ListaOpcionBasica[]
  unidadesMedida: ListaOpcionBasica[]
}

export interface CreateDocumentoSalidaPayload {
  codigoTipoOrden: CodigoTipoOrdenSalida
  idSucursal: number
  idAlmacen: number
  idVenta?: number
  idCliente?: number
  idDestinatario?: number
  idProveedor?: number
  idDocSalidaOrigen?: number
  fecha?: string
  fechaTraslado?: string
  observaciones?: string
  idUsuarioAuditoria?: number
}

export interface CrearDesdeVentaPayload {
  idVenta: number
  idDestinatario?: number
  fechaTraslado?: string
  idUsuarioAuditoria?: number
}

export interface CreateDocumentoSalidaDetallePayload {
  idProducto?: number
  idBalon?: number
  cantidad: number
  descripcion?: string
  idUnidadMedida?: number
  glosa?: string
  idUsuarioAuditoria?: number
}

export interface ConvertirGrePayload {
  idTipoGuiaRemision?: number
  serie: string
  idMotivoTraslado?: number
  idModalidadTraslado?: number
  idTransportista?: number
  idChofer?: number
  idVehiculo?: number
  idUnidadMedida?: number
  pesoBruto?: number
  numeroBultos?: number
  direccionOrigen?: string
  idDistritoOrigen?: number
  direccionLlegada?: string
  idDistritoLlegada?: number
  fechaTraslado?: string
  idUsuarioAuditoria?: number
}

export interface FinalizarRecargaPayload {
  idComprobanteCompra?: number
  fechaLlegadaAlmacen: string
  idAlmacen: number
  idProveedor?: number
  lote?: string
  fechaVencimientoLote?: string
  fechaPruebaHidrostatica?: string
  guardarBalonesAlmacen?: boolean
  idUsuarioAuditoria?: number
}

export interface GenerarRecojoDocSalidaPayload {
  fechaProgramada?: string
  idUsuarioResponsable?: number
  observacion?: string
  idUsuarioAuditoria?: number
}

export interface RegistrarDireccionEntregaPayload {
  idDireccionCliente?: number
  direccionEntrega?: string
  referenciaEntrega?: string
  latitud?: number
  longitud?: number
  idDistritoEntrega?: number
  idUsuarioAuditoria?: number
}

export interface AnularDocumentoSalidaPayload {
  motivo?: string
  idUsuarioAuditoria?: number
}

export interface EmitirDocumentoSalidaResponse {
  documento: DocumentoSalida
  sunat: {
    estado: string
    hash?: string | null
    ticket?: string | null
    respuesta?: unknown
  }
}

export interface SiguienteNumeroDocumentoSalidaResponse {
  numero: string
}
