export interface ComprobanteListItem {
  id: number
  id_tipo_comprobante: number
  nombre_tipo_comprobante?: string | null
  codigo_tipo_comprobante?: string | null
  serie: string
  numero: string
  fecha: string
  id_cliente: number
  nombre_cliente?: string | null
  documento_cliente?: string | null
  total_importe?: number | null
  id_estado?: number | null
  nombre_estado?: string | null
  id_estado_sunat?: number | null
  nombre_estado_sunat?: string | null
  id_comprobante_origen?: number | null
  serie_comprobante_origen?: string | null
  numero_comprobante_origen?: string | null
  codigo_tipo_comprobante_origen?: string | null
  nombre_tipo_comprobante_origen?: string | null
  id_motivo_nota?: number | null
  nombre_motivo_nota?: string | null
  codigo_motivo_nota?: string | null
  id_comprobante_destino?: number | null
  serie_comprobante_destino?: string | null
  numero_comprobante_destino?: string | null
  codigo_tipo_comprobante_destino?: string | null
  nombre_tipo_comprobante_destino?: string | null
  id_actividad?: number | null
  titulo_actividad?: string | null
  nombre_tipo_actividad?: string | null
  nombre_estado_actividad?: string | null
  nombre_chofer_responsable?: string | null
  tiene_actividad?: boolean | null
}

export interface ComprobanteDetalle {
  id?: number
  item?: number
  id_producto: number
  codigo_producto?: string | null
  nombre_producto?: string | null
  es_gas?: boolean | null
  es_servicio?: boolean | null
  es_alquilable?: boolean | null
  descripcion?: string | null
  nombre_unidad_medida?: string | null
  cantidad: number
  precio_unitario: number
  descuento?: number | null
  porcentaje_igv?: number | null
  id_afectacion_igv?: number | null
  codigo_afectacion_igv?: string | null
  valor_venta?: number | null
  impuesto?: number | null
  importe?: number | null
  id_balon?: number | null
  codigo_balon?: string | null
}

export interface Comprobante extends ComprobanteListItem {
  sub_total?: number | null
  descuento?: number | null
  valor_venta?: number | null
  igv?: number | null
  exonerado?: number | null
  glosa?: string | null
  observaciones?: string | null
  hash_documento?: string | null
  xml_firmado?: string | null
  ticket_sunat?: string | null
  id_comprobante_origen?: number | null
  serie_comprobante_origen?: string | null
  numero_comprobante_origen?: string | null
  codigo_tipo_comprobante_origen?: string | null
  id_motivo_nota?: number | null
  codigo_motivo_nota?: string | null
  nombre_motivo_nota?: string | null
  id_moneda?: number | null
  id_medio_pago?: number | null
  id_almacen?: number | null
  id_tipo_operacion_sunat?: number | null
  /** Pestaña POS de emisión: accesorios|recarga|medicinal|industrial|mantenimiento */
  origen_pos?: string | null
  detalles: ComprobanteDetalle[]
  cuotas?: unknown[]
}

export interface ComprobanteListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idTipoComprobante?: number
  idCliente?: number
  idEstado?: number
  idEstadoSunat?: number
  fechaDesde?: string
  fechaHasta?: string
  serie?: string
}

export interface ComprobanteDetallePayload {
  idProducto: number
  cantidad: number
  precioUnitario: number
  descuento?: number
  porcentajeIgv?: number
  idAfectacionIgv?: number
  descripcion?: string
  idBalon?: number
}

export interface CreateComprobantePayload {
  idUsuarioAuditoria: number
  idTipoComprobante: number
  serie: string
  numero?: string
  fecha: string
  idCliente: number
  detalles: ComprobanteDetallePayload[]
  idTipoOperacionSunat?: number
  idComprobanteOrigen?: number
  idMotivoNota?: number
  idMoneda?: number
  idMedioPago?: number
  idCondicionPago?: number
  fechaVencimiento?: string
  idAlmacen?: number
  glosa?: string
  observaciones?: string
  /** Pestaña POS: accesorios|recarga|medicinal|industrial|mantenimiento */
  origenPos?: string
  /** Recarga, préstamo, alquiler, garantía, mantenimiento y baja en la misma transacción del CPE */
  efectosPos?: EfectosPosPayload
}

export interface EfectoPosGarantiaPayload {
  monto: number
  idProducto?: number
  cantidadVenta?: number
  idUnidadMedida?: number
  fechaRegistro?: string
  idMedioPago?: number
  observacion?: string
}

export interface EfectoPosRecargaPayload {
  idBalon: number
  idProducto: number
  capacidad?: number
  idAlmacen?: number
  observacion?: string
  idBalonOrigen?: number
}

export interface EfectoPosPrestamoPayload {
  idTipoPrestamo: number
  idAlmacen?: number
  fechaSalida?: string
  fechaRetornoPactada?: string
  titulo?: string
  observacion?: string
  idEstado?: number
  idBalon: number
  idProducto?: number
  fechaEntregado?: string
  fechaPrestamo?: string
  fechaVencimiento?: string
  observacionDetalle?: string
  garantia?: EfectoPosGarantiaPayload
}

export interface EfectoPosAlquilerPayload {
  idAlmacen: number
  fechaInicio: string
  fechaFinPactada?: string
  tarifaDiaria?: number
  totalCobrado?: number
  idProductoRegulador?: number
  idProductoStock?: number
  observacion?: string
  periodo?: {
    fechaInicio: string
    fechaFin: string
    monto: number
    idProducto?: number
    observacion?: string
  }
  garantia?: EfectoPosGarantiaPayload
}

export interface EfectoPosMantenimientoPayload {
  idBalon: number
  fechaIngreso: string
  idTipoMantenimiento?: number
  descripcion?: string
  costo?: number
  observacion?: string
}

export interface EfectoPosBajaPayload {
  idBalon: number
  idMotivoBaja: number
  montoVenta?: number
  observacion?: string
  fechaBaja?: string
  aprobar?: boolean
}

export interface EfectosPosPayload {
  recargas?: EfectoPosRecargaPayload[]
  prestamos?: EfectoPosPrestamoPayload[]
  alquileres?: EfectoPosAlquilerPayload[]
  mantenimientos?: EfectoPosMantenimientoPayload[]
  bajas?: EfectoPosBajaPayload[]
  /** Opt-in: generar GRE remitente junto al préstamo de cilindro. */
  generarGre?: boolean
}

export interface UpdateComprobantePayload {
  idUsuarioAuditoria: number
  fecha?: string
  idCliente?: number
  detalles?: ComprobanteDetallePayload[]
  idTipoOperacionSunat?: number
  idMoneda?: number
  idMedioPago?: number
  idAlmacen?: number
  glosa?: string
  observaciones?: string
  origenPos?: string
}

export interface EmitirComprobanteResponse {
  comprobante: Comprobante
  sunat: {
    estado: string
    hash?: string | null
    ticket: string | null
    respuesta: unknown
  }
}

export interface SiguienteNumeroResponse {
  serie: string
  id_tipo_comprobante: number
  ultimo_numero: string | null
  numero: string
}

export interface ListaOpcionBasica {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface ComprobanteCatalogosPos {
  tiposComprobante: ListaOpcionBasica[]
  afectacionesIgv: ListaOpcionBasica[]
  monedas: ListaOpcionBasica[]
  mediosPago: ListaOpcionBasica[]
  tiposOperacionSunat: ListaOpcionBasica[]
  estadosSunat: ListaOpcionBasica[]
  motivosNotaCredito: ListaOpcionBasica[]
}

export interface ComprobanteResumenDiarioItem {
  id: number
  codigo_tipo_comprobante?: string | null
  nombre_tipo_comprobante?: string | null
  serie: string
  numero: string
  fecha: string
  id_cliente: number
  nombre_cliente?: string | null
  documento_cliente?: string | null
  nombre_estado_sunat?: string | null
  total_importe?: number | null
}

export interface ResumenDiarioPreview {
  fecha: string
  cantidad: number
  total: number
  items: ComprobanteResumenDiarioItem[]
}

export interface ResumenDiarioListItem {
  id: number
  fecha: string
  correlativo: string
  identificador?: string | null
  ticket_sunat?: string | null
  id_estado_sunat?: number | null
  nombre_estado_sunat?: string | null
  moneda?: string | null
  cantidad_docs: number
  total_importe: number
  total_igv?: number | null
  total_valor_venta?: number | null
  fecha_creacion?: string | null
  nombre_usuario_creacion?: string | null
}

export interface ResumenDiarioDetalle {
  id: number
  id_resumen: number
  id_comprobante: number
  item: number
  serie?: string | null
  numero?: string | null
  codigo_tipo_comprobante?: string | null
  nombre_tipo_comprobante?: string | null
  fecha_comprobante?: string | null
  total_importe?: number | null
  nombre_estado_sunat?: string | null
  nombre_cliente?: string | null
  documento_cliente?: string | null
}

export interface ResumenDiario extends ResumenDiarioListItem {
  cdr_respuesta?: string | null
  observacion?: string | null
  detalles: ResumenDiarioDetalle[]
}

export interface ResumenDiarioListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idEstadoSunat?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface EnviarResumenDiarioPayload {
  idUsuarioAuditoria: number
  fecha: string
  correlativo?: string
  idsComprobante?: number[]
}

export interface EnviarResumenDiarioResponse {
  resumen: ResumenDiario
  fecha: string
  correlativo: string
  cantidad: number
  items: ComprobanteResumenDiarioItem[]
  sunat: {
    estado: string
    ticket: string | null
    respuesta: unknown
  }
}

export interface ConsultarEstadoResumenResponse {
  resumen: ResumenDiario
  sunat: {
    estado: string
    ticket: string | null
    respuesta: unknown
  }
}

export interface SiguienteCorrelativoResumenResponse {
  fecha: string
  ultimo_correlativo: string | null
  correlativo: string
}

export interface PosLineItem {
  key: string
  idProducto: number
  codigo: string
  nombre: string
  cantidad: number
  precioUnitario: number
  idAfectacionIgv?: number
  afectaStock?: boolean
  /** Stock del almacén al momento de agregar (para validar cantidades). */
  stockDisponible?: number | null
  /** Nombre U.M. del producto (p. ej. UNID) para validar cantidades enteras. */
  nombreUnidadMedida?: string | null
  esGas?: boolean
  esServicio?: boolean
  esAlquilable?: boolean
  /** Origen del flujo Añadir en POS. */
  tipoPos?: 'accesorio' | 'gas' | 'alquiler' | 'mantenimiento'
  /** Balón vinculado (recarga, entrega de cilindro o mantenimiento). */
  idBalon?: number
  /** Balón EMPRESA origen que surte la recarga cliente. */
  idBalonOrigen?: number
  /** Etiqueta legible del cilindro origen. */
  etiquetaBalonOrigen?: string
  /** Etiqueta legible del cilindro (código · tipo · …). */
  etiquetaBalon?: string
  capacidad?: number
  fechaInicioAlquiler?: string
  fechaFinAlquiler?: string
  observacionLinea?: string
  /**
   * Escenario al vender gas:
   * balon_cliente (recarga) | entregar_prestamo | comprar_balon.
   * Legacy: solo_gas / entregar_alquiler se normalizan en el POS.
   */
  escenarioGas?:
    | 'balon_cliente'
    | 'entregar_prestamo'
    | 'comprar_balon'
    | 'solo_gas'
    | 'entregar_alquiler'
  /** Precio del envase cuando se vende el cilindro junto con el gas. */
  precioBalon?: number
  /** Producto con el que se factura el envase (venta de cilindro). */
  idProductoEnvase?: number
  nombreProductoEnvase?: string
  /** Precio del periodo de alquiler cuando se entrega cilindro con el gas. */
  precioAlquiler?: number
  /** Producto/servicio con el que se factura el alquiler. */
  idProductoAlquiler?: number
  nombreProductoAlquiler?: string
  /** Depósito reembolsable al entregar cilindro en préstamo (editable en POS). */
  montoGarantia?: number
  /** Medio con el que se recibe la garantía (si montoGarantia > 0). */
  idMedioPagoGarantia?: number
  /** Comentario / nro. operación de la recepción de garantía. */
  observacionGarantia?: string
  /** Mantenimiento (registro independiente en balones). */
  esMantenimiento?: boolean
  idTipoMantenimiento?: number
  fechaIngresoMantenimiento?: string
  descripcionMantenimiento?: string
}
