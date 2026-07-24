export interface GarantiaMovimiento {
  id: number
  id_garantia: number
  id_tipo_movimiento: number
  nombre_tipo_movimiento?: string | null
  id_comprobante?: number | null
  serie_comprobante?: string | null
  numero_comprobante?: string | null
  comprobante?: string | null
  fecha: string
  monto: number
  observacion?: string | null
  fecha_creacion?: string | null
}

export interface Garantia {
  id: number
  id_cliente: number
  nombre_cliente?: string | null
  documento_cliente?: string | null
  id_prestamo?: number | null
  numero_prestamo?: string | null
  titulo_prestamo?: string | null
  ubicacion?: string | null
  id_producto?: number | null
  codigo_producto?: string | null
  nombre_producto?: string | null
  precio_garantia_producto?: number | null
  cantidad_venta?: number | null
  id_unidad_medida?: number | null
  nombre_unidad_medida?: string | null
  fecha_registro: string
  monto_cobrado: number
  monto_devuelto: number
  monto_saldo: number
  id_estado?: number | null
  nombre_estado?: string | null
  observacion?: string | null
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string | null
  movimientos?: GarantiaMovimiento[]
}

export interface GarantiaListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idCliente?: number
  idPrestamo?: number
  idEstado?: number
}

export interface CreateGarantiaPayload {
  idUsuarioAuditoria: number
  idCliente: number
  monto: number
  idComprobante?: number
  idPrestamo?: number
  idProducto?: number
  ubicacion?: string
  cantidadVenta?: number
  idUnidadMedida?: number
  fechaRegistro?: string
  observacion?: string
}

export interface DevolverGarantiaPayload {
  idUsuarioAuditoria: number
  monto: number
  idComprobante?: number
  fecha?: string
  observacion?: string
}
