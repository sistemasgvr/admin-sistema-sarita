/** Fila de "DATOS DE ANÁLISIS" de la ficha ICP. */
export interface LoteProtocoloPrueba {
  id?: number
  orden?: number
  prueba: string
  especificacion?: string | null
  resultado?: string | null
}

/** Fila de "RELACIÓN DE ENVASES APROBADOS". */
export interface LoteProtocoloEnvase {
  id?: number
  serie_envase: string
  /** null cuando la planta incluyó un envase que no está registrado aquí. */
  id_balon?: number | null
  codigo_balon?: string | null
  nombre_tipo_balon?: string | null
  nombre_estado_balon?: string | null
  es_lote_vigente?: boolean | null
}

export interface LoteProtocolo {
  id: number
  numero_lote: string
  numero_protocolo: string | null
  id_proveedor: number | null
  nombre_proveedor: string | null
  id_producto_gas: number | null
  nombre_producto_gas: string | null
  descripcion_producto: string | null
  forma_farmaceutica?: string | null
  presentacion: string | null
  norma_tecnica?: string | null
  metodo_fabricacion?: string | null
  fecha_analisis: string | null
  fecha_emision: string | null
  fecha_fabricacion: string | null
  fecha_vencimiento: string | null
  vencido: boolean
  tamano_lote_m3: number | string | null
  cantidad_envases: number | null
  valoracion_o2_pct: number | string | null
  limite_co2_ppm?: number | string | null
  limite_co_ppm?: number | string | null
  cilindro_muestreado_serie: string | null
  temperatura_muestreo_c?: number | string | null
  presion_muestreo_psi?: number | string | null
  analista?: string | null
  conclusion?: string | null
  codigo_documento?: string | null
  version_documento?: string | null
  id_archivo_pdf: number | null
  ruta_archivo_pdf: string | null
  nombre_archivo_pdf?: string | null
  observacion?: string | null
  total_envases?: number
  total_envases_vinculados?: number
  total_balones_vigentes?: number
  pruebas?: LoteProtocoloPrueba[]
  envases?: LoteProtocoloEnvase[]
  fecha_creacion?: string
  fecha_modificacion?: string
}

export interface LoteProtocoloListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idProveedor?: number
  idProductoGas?: number
  vencidos?: boolean
  fechaDesde?: string
  fechaHasta?: string
}

export interface LoteProtocoloPayload {
  idUsuarioAuditoria: number
  numeroLote?: string
  numeroProtocolo?: string
  idProveedor?: number
  idProductoGas?: number
  descripcionProducto?: string
  formaFarmaceutica?: string
  presentacion?: string
  normaTecnica?: string
  metodoFabricacion?: string
  fechaAnalisis?: string
  fechaEmision?: string
  fechaFabricacion?: string
  /** La ficha trae mes/año; se envía como el día 1 de ese mes. */
  fechaVencimiento?: string
  tamanoLoteM3?: number
  cantidadEnvases?: number
  valoracionO2Pct?: number
  limiteCo2Ppm?: number
  limiteCoPpm?: number
  cilindroMuestreadoSerie?: string
  temperaturaMuestreoC?: number
  presionMuestreoPsi?: number
  analista?: string
  conclusion?: string
  codigoDocumento?: string
  versionDocumento?: string
  idArchivoPdf?: number
  observacion?: string
  pruebas?: Array<Pick<LoteProtocoloPrueba, 'orden' | 'prueba'> & {
    especificacion?: string
    resultado?: string
  }>
  envases?: Array<{ serieEnvase: string }>
}

export interface CreateLoteProtocoloPayload extends LoteProtocoloPayload {
  numeroLote: string
}

export type UpdateLoteProtocoloPayload = LoteProtocoloPayload

export interface AplicarLoteProtocoloPayload {
  idUsuarioAuditoria: number
  /** Omitir para aplicar a los envases que ya emparejaron por número de serie. */
  idBalones?: number[]
  /** Orden de salida a la que se engancha la ficha (doc_salida.id_lote_protocolo). */
  idDocSalida?: number
}

export interface AplicarLoteProtocoloResult {
  idLoteProtocolo: number
  balonesAplicados: number
  envasesVinculados: number
}

/** Una recarga del cilindro que referencia una ficha. */
export interface LoteProtocoloHistorialItem {
  origen: 'PLANTA_EXTERNA' | 'MOVIMIENTO_RECARGA'
  id_documento: number
  numero_documento: string | null
  fecha: string | null
  id_lote_protocolo: number
  numero_lote: string
  numero_protocolo: string | null
  fecha_vencimiento: string | null
  vencido: boolean
  valoracion_o2_pct: number | string | null
  id_archivo_pdf: number | null
  ruta_archivo_pdf: string | null
  id_almacen: number | null
  nombre_almacen: string | null
  id_proveedor: number | null
  nombre_proveedor: string | null
  es_vigente: boolean
}

/** Resumen que viaja en meta.resumen del historial. */
export interface LoteProtocoloVigente {
  id: number
  numero_lote: string
  numero_protocolo: string | null
  fecha_vencimiento: string | null
  vencido: boolean
  valoracion_o2_pct: number | string | null
  id_archivo_pdf: number | null
  ruta_archivo_pdf: string | null
}

export interface DeleteLoteProtocoloResponse {
  eliminado: boolean
  id: number
}

export type LoteProtocoloFormMode = 'create' | 'edit'
