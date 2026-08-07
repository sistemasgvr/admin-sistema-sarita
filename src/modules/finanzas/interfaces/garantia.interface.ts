export type EstadoGarantia = 'ACTIVA' | 'PARCIAL' | 'DEVUELTA'
export type OrigenGarantia = 'PRESTAMO' | 'ALQUILER' | 'POS' | 'MANUAL'

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
  id_alquiler?: number | null
  numero_alquiler?: string | null
  ubicacion?: string | null
  id_producto?: number | null
  codigo_producto?: string | null
  nombre_producto?: string | null
  cantidad_venta?: number | null
  fecha_registro: string
  monto_cobrado: number
  monto_devuelto: number
  monto_saldo: number
  id_estado?: number | null
  nombre_estado?: string | null
  observacion?: string | null
  id_medio_pago?: number | null
  medio_pago?: string | null
  fecha_reembolso?: string | null
  id_medio_reembolso?: number | null
  medio_reembolso?: string | null
  observacion_reembolso?: string | null
  origen?: OrigenGarantia | null
  es_manual?: boolean | null
  puede_editar?: boolean | null
  puede_eliminar?: boolean | null
  comprobante_cobro?: string | null
  id_comprobante_cobro?: number | null
  estado: number
  fecha_creacion?: string
  fecha_modificacion?: string | null
  movimientos?: GarantiaMovimiento[]
}

export interface GarantiaListFilters {
  buscar?: string
  idCliente?: number
  desde?: string
  hasta?: string
  estado?: EstadoGarantia
  pagina?: number
  limite?: number
}

export interface CrearGarantiaPayload {
  fecha: string
  idCliente: number
  importe: number
  idMedioPago?: number
  observacion?: string
  idComprobante?: number
  idPrestamo?: number
  idAlquiler?: number
  idProducto?: number
  idUsuarioAuditoria?: number
}

export interface ActualizarGarantiaPayload {
  fecha?: string
  idCliente?: number
  idMedioPago?: number
  importe?: number
  observacion?: string
  idUsuarioAuditoria?: number
}

export interface ReembolsarGarantiaPayload {
  monto: number
  fecha?: string
  idComprobante?: number
  idMedioReembolso?: number
  observacion?: string
  idUsuarioAuditoria?: number
}

/** Respuesta del endpoint de verificación de duplicados. */
export interface DuplicadoPagoInfo {
  duplicado: boolean
  severidad?: 'alta' | 'media'
  mensaje?: string
  pagoExistente?: {
    id: number
    idCuenta: number
    fechaPago: string
    monto: number
    numeroComprobante?: string | null
  }
}

export interface VerificarDuplicadoPagoPayload {
  idCuenta: number
  fechaPago: string
  monto: number
  diasVentana?: number
  numeroComprobante?: string
}
