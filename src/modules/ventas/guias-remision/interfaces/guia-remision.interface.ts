export interface GuiaRemisionListItem {
  id: number
  id_tipo_guia_remision: number
  nombre_tipo_guia?: string | null
  codigo_tipo_guia?: string | null
  serie: string
  numero: string
  fecha: string
  fecha_traslado?: string | null
  id_destinatario?: number | null
  nombre_destinatario?: string | null
  documento_destinatario?: string | null
  nombre_motivo_traslado?: string | null
  codigo_motivo_traslado?: string | null
  nombre_modalidad_traslado?: string | null
  codigo_modalidad_traslado?: string | null
  peso_bruto?: number | null
  numero_bultos?: number | null
  nombre_estado?: string | null
  nombre_estado_sunat?: string | null
  ticket_sunat?: string | null
  total_detalles?: number | null
}

export interface GuiaRemisionDetalle {
  id?: number
  item?: number
  id_producto: number
  codigo_producto?: string | null
  nombre_producto?: string | null
  descripcion?: string | null
  id_unidad_medida?: number | null
  nombre_unidad_medida?: string | null
  cantidad: number
  id_balon?: number | null
  codigo_balon?: string | null
  glosa?: string | null
}

export interface GuiaRemisionReferencia {
  id?: number
  id_tipo_comprobante: number
  nombre_tipo_comprobante?: string | null
  codigo_tipo_comprobante?: string | null
  serie?: string | null
  numero?: string | null
  fecha?: string | null
}

export interface GuiaRemision extends GuiaRemisionListItem {
  id_sucursal: number
  nombre_sucursal?: string | null
  id_almacen: number
  nombre_almacen?: string | null
  id_cliente?: number | null
  nombre_cliente?: string | null
  documento_cliente?: string | null
  codigo_tipo_doc_cliente?: string | null
  nombre_tipo_doc_cliente?: string | null
  id_motivo_traslado?: number | null
  id_unidad_medida?: number | null
  nombre_unidad_medida?: string | null
  direccion_origen?: string | null
  id_distrito_origen?: number | null
  nombre_distrito_origen?: string | null
  ubigeo_origen?: string | null
  id_provincia_origen?: number | null
  id_departamento_origen?: number | null
  id_pais_origen?: number | null
  direccion_llegada?: string | null
  id_distrito_llegada?: number | null
  nombre_distrito_llegada?: string | null
  ubigeo_llegada?: string | null
  id_provincia_llegada?: number | null
  id_departamento_llegada?: number | null
  id_pais_llegada?: number | null
  id_modalidad_traslado?: number | null
  id_transportista?: number | null
  nombre_transportista?: string | null
  id_chofer?: number | null
  nombre_chofer?: string | null
  documento_chofer?: string | null
  licencia_chofer?: string | null
  id_vehiculo?: number | null
  placa_vehiculo?: string | null
  id_responsable?: number | null
  observaciones?: string | null
  hash_documento?: string | null
  detalles: GuiaRemisionDetalle[]
  referencias?: GuiaRemisionReferencia[]
}

export interface GuiaRemisionListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idTipoGuia?: number
  idDestinatario?: number
  idEstado?: number
  idEstadoSunat?: number
  fechaDesde?: string
  fechaHasta?: string
  serie?: string
}

export interface GuiaRemisionCatalogos {
  tiposGuia: { id: number; nombre: string; descripcion?: string | null }[]
  modalidadesTraslado: { id: number; nombre: string; descripcion?: string | null }[]
  motivosTraslado: { id: number; nombre: string; descripcion?: string | null }[]
  estadosGuia: { id: number; nombre: string; descripcion?: string | null }[]
  estadosSunat: { id: number; nombre: string; descripcion?: string | null }[]
  unidadesMedida: { id: number; nombre: string; descripcion?: string | null }[]
}

export interface GuiaRemisionDetallePayload {
  item?: number
  idProducto: number
  descripcion?: string
  idUnidadMedida?: number
  cantidad: number
  idBalon?: number
  glosa?: string
}

export interface CreateGuiaRemisionPayload {
  idTipoGuiaRemision: number
  serie: string
  numero?: string
  fecha?: string
  fechaTraslado?: string
  idSucursal: number
  idAlmacen: number
  idCliente?: number
  idMotivoTraslado: number
  idUnidadMedida?: number
  pesoBruto: number
  numeroBultos?: number
  direccionOrigen?: string
  idDistritoOrigen: number
  idDestinatario: number
  direccionLlegada?: string
  idDistritoLlegada: number
  idModalidadTraslado: number
  idTransportista?: number
  idChofer?: number
  idVehiculo?: number
  idResponsable?: number
  observaciones?: string
  detalles: GuiaRemisionDetallePayload[]
  idUsuarioAuditoria: number
}

export type UpdateGuiaRemisionPayload = Omit<
  CreateGuiaRemisionPayload,
  'idTipoGuiaRemision' | 'serie' | 'numero'
>

export interface SiguienteNumeroGuiaResponse {
  serie: string
  numero: string
}

export interface EmitirGuiaRemisionResponse {
  guia: GuiaRemision
  sunat: {
    estado: string
    hash?: string | null
    ticket?: string | null
    respuesta?: unknown
  }
}
