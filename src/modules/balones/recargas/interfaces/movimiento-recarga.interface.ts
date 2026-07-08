export interface MovimientoRecarga {
  id: number
  fecha_salida_almacen: string
  id_balon: number
  codigo_balon?: string | null
  id_producto?: number | null
  nombre_producto?: string | null
  capacidad?: number | null
  id_unidad_medida?: number | null
  nombre_unidad_medida?: string | null
  serie_guia_salida?: string | null
  numero_guia_salida?: string | null
  serie_guia_ingreso?: string | null
  numero_guia_ingreso?: string | null
  serie_factura?: string | null
  numero_factura?: string | null
  id_comprobante?: number | null
  fecha_llegada_almacen?: string | null
  lote?: string | null
  fecha_vencimiento_lote?: string | null
  fecha_prueba_hidrostatica?: string | null
  id_proveedor?: number | null
  nombre_proveedor?: string | null
  observacion?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string
}

export interface MovimientoRecargaListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idBalon?: number
  idAlmacen?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface CreateMovimientoRecargaPayload {
  idUsuarioAuditoria: number
  fechaSalidaAlmacen: string
  idBalon: number
  idProducto?: number
  capacidad?: number
  idUnidadMedida?: number
  serieGuiaSalida?: string
  numeroGuiaSalida?: string
  serieGuiaIngreso?: string
  numeroGuiaIngreso?: string
  serieFactura?: string
  numeroFactura?: string
  idComprobante?: number
  fechaLlegadaAlmacen?: string
  lote?: string
  fechaVencimientoLote?: string
  fechaPruebaHidrostatica?: string
  idProveedor?: number
  observacion?: string
  idAlmacen?: number
}

export interface UpdateMovimientoRecargaPayload {
  idUsuarioAuditoria: number
  fechaSalidaAlmacen?: string
  idProducto?: number
  capacidad?: number
  idUnidadMedida?: number
  serieGuiaSalida?: string
  numeroGuiaSalida?: string
  serieGuiaIngreso?: string
  numeroGuiaIngreso?: string
  serieFactura?: string
  numeroFactura?: string
  idComprobante?: number
  fechaLlegadaAlmacen?: string
  lote?: string
  fechaVencimientoLote?: string
  fechaPruebaHidrostatica?: string
  idProveedor?: number
  observacion?: string
  idAlmacen?: number
}

export interface DeleteMovimientoRecargaResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type MovimientoRecargaFormMode = 'create' | 'edit'
