export interface RecargaPlantaDetalle {
  id?: number
  id_recarga_planta?: number
  id_balon: number
  codigo_balon?: string | null
  id_producto?: number | null
  nombre_producto?: string | null
  codigo_producto?: string | null
  capacidad?: number | null
  id_unidad_medida?: number | null
  nombre_unidad_medida?: string | null
  lote?: string | null
  fecha_vencimiento_lote?: string | null
  fecha_prueba_hidrostatica?: string | null
  id_movimiento_recarga?: number | null
  observacion?: string | null
  nombre_estado_balon?: string | null
  nombre_estado_contenido?: string | null
}

export interface RecargaPlanta {
  id: number
  numero?: string | null
  fecha_salida: string
  id_proveedor?: number | null
  nombre_proveedor?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  id_guia_salida?: number | null
  serie_guia_salida?: string | null
  numero_guia_salida?: string | null
  id_guia_retorno?: number | null
  serie_guia_ingreso?: string | null
  numero_guia_ingreso?: string | null
  id_comprobante_compra?: number | null
  serie_factura?: string | null
  numero_factura?: string | null
  fecha_llegada_almacen?: string | null
  lote?: string | null
  fecha_vencimiento_lote?: string | null
  fecha_prueba_hidrostatica?: string | null
  id_estado?: number | null
  nombre_estado?: string | null
  descripcion_estado?: string | null
  total_cilindros?: number | null
  observacion?: string | null
  detalles?: RecargaPlantaDetalle[]
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string
}

export interface RecargaPlantaListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idProveedor?: number
  idAlmacen?: number
  idEstado?: number
  fechaDesde?: string
  fechaHasta?: string
}

/** Fila aplanada del protocolo operativo (ida / GRE / factura / retorno / lote / cilindro). */
export interface RecargaPlantaProtocoloFila {
  id_recarga_planta: number
  numero_orden?: string | null
  fecha_salida?: string | null
  id_proveedor?: number | null
  nombre_proveedor?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  serie_guia_salida?: string | null
  numero_guia_salida?: string | null
  serie_guia_ingreso?: string | null
  numero_guia_ingreso?: string | null
  serie_factura?: string | null
  numero_factura?: string | null
  fecha_llegada_almacen?: string | null
  lote?: string | null
  fecha_vencimiento_lote?: string | null
  fecha_prueba_hidrostatica?: string | null
  nombre_estado?: string | null
  id_detalle?: number | null
  id_balon?: number | null
  codigo_balon?: string | null
  id_producto?: number | null
  nombre_producto?: string | null
  codigo_producto?: string | null
  capacidad?: number | null
  nombre_unidad_medida?: string | null
  observacion_detalle?: string | null
  observacion_orden?: string | null
}

export interface RecargaPlantaDetallePayload {
  idBalon: number
  idProducto?: number
  capacidad?: number
  idUnidadMedida?: number
  observacion?: string
}

export interface CreateRecargaPlantaPayload {
  idUsuarioAuditoria: number
  fechaSalida: string
  idProveedor?: number
  idAlmacen?: number
  idGuiaSalida?: number
  serieGuiaSalida?: string
  numeroGuiaSalida?: string
  observacion?: string
  confirmarSalida?: boolean
  detalles: RecargaPlantaDetallePayload[]
}

export interface UpdateRecargaPlantaPayload {
  idUsuarioAuditoria: number
  fechaSalida?: string
  idProveedor?: number
  idAlmacen?: number
  idGuiaRetorno?: number
  serieGuiaIngreso?: string
  numeroGuiaIngreso?: string
  idComprobanteCompra?: number
  serieFactura?: string
  numeroFactura?: string
  fechaLlegadaAlmacen?: string
  lote?: string
  fechaVencimientoLote?: string
  fechaPruebaHidrostatica?: string
  observacion?: string
}

export type RecargaPlantaFormMode = 'create' | 'edit'
