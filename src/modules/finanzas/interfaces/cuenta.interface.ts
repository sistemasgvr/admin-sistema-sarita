export type TipoCuenta = 'COBRAR' | 'PAGAR'

export type EstadoCuenta = 'PENDIENTE' | 'PARCIAL' | 'VENCIDO' | 'PAGADO'

/** Campos comunes de una cuenta financiera (los devuelve el backend en snake_case). */
export interface CuentaFinancieraBase {
  id: number
  id_tipo_cuenta: number
  tipo: string
  id_tercero: number
  tercero: string
  documento_tercero: string | null
  id_comprobante_venta: number | null
  id_comprobante_compra: number | null
  comprobante: string | null
  fecha_emision: string | null
  fecha_vencimiento: string | null
  monto_pendiente: number
  monto_abonado: number
  saldo: number
  estado_calculado: EstadoCuenta
  observacion: string | null
}

/** Fila de listado (incluye días de vencimiento). */
export interface CuentaFinanciera extends CuentaFinancieraBase {
  dias_vencido: number
}

/** Pago aplicado a una cuenta (camelCase, tal como lo arma la función de detalle). */
export interface PagoFinanciero {
  id: number
  fechaPago: string
  monto: number
  idMedioPago: number | null
  medioPago: string | null
  referencia: string | null
  observacion: string | null
  fechaCreacion: string
}

/** Detalle de una cuenta con su historial de pagos. */
export interface CuentaFinancieraDetalle extends CuentaFinancieraBase {
  pagos: PagoFinanciero[]
}

export interface ResumenCuentas {
  totalPendiente: number
  cantidadCuentas: number
  totalVencido: number
  cantidadVencidas: number
  cantidadTerceros: number
}

export interface MedioPago {
  id: number
  nombre: string
}

export interface CuentaListFilters {
  buscar?: string
  estado?: EstadoCuenta
  soloPendientes?: number
  idTercero?: number
  pagina?: number
  limite?: number
}

export interface RegistrarPagoPayload {
  idCuenta: number
  monto: number
  fechaPago?: string
  idMedioPago?: number
  referencia?: string
  observacion?: string
  idUsuarioAuditoria?: number
}

export interface CrearCuentaPayload {
  idTercero: number
  fechaEmision: string
  fechaVencimiento?: string
  monto: number
  observacion?: string
  idUsuarioAuditoria?: number
}
