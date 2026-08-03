export type TipoCuenta = 'COBRAR' | 'PAGAR'

export type EstadoCuenta = 'PENDIENTE' | 'PARCIAL' | 'VENCIDO' | 'PAGADO'

/** Campos comunes de una cuenta financiera (los devuelve el backend en snake_case). */
export interface CuentaFinancieraBase {
  id: number
  id_tipo_cuenta: number
  tipo: string
  /** Nullable desde la unificación: puede venir como texto libre en `tercero_nombre`. */
  id_tercero: number | null
  tercero_nombre: string | null
  tercero: string
  documento_tercero: string | null
  id_comprobante_venta: number | null
  id_comprobante_compra: number | null
  /** Cuotas dentro de un plan (auto-referencia). */
  id_cuenta_padre: number | null
  numero_cuota: number | null
  numero_cuotas_total: number | null
  /** Contexto de préstamo (solo cabecera). */
  descripcion: string | null
  id_banco: number | null
  tasa_interes: number | null
  /** N° de comprobante libre (para cuentas manuales sin FK). */
  numero_comprobante: string | null
  comprobante: string | null
  fecha_emision: string | null
  fecha_vencimiento: string | null
  monto_pendiente: number
  monto_abonado: number
  saldo: number
  estado_calculado: EstadoCuenta
  observacion: string | null
}

/** Fila de listado (incluye días de vencimiento y flag es_plan). */
export interface CuentaFinanciera extends CuentaFinancieraBase {
  dias_vencido: number
  es_plan: boolean
}

/** Cuota hija de un plan (viene dentro del detalle de la cabecera). */
export interface CuotaHija {
  id: number
  numeroCuota: number
  fechaVencimiento: string | null
  montoPendiente: number
  montoAbonado: number
  saldo: number
  estadoCalculado: EstadoCuenta
}

/** Pago aplicado a una cuenta (camelCase, tal como lo arma la función de detalle). */
export interface PagoFinanciero {
  id: number
  fechaPago: string
  monto: number
  idMedioPago: number | null
  medioPago: string | null
  idCuentaBancaria: number | null
  numeroOperacion: string | null
  referencia: string | null
  observacion: string | null
  fechaCreacion: string
}

/** Detalle de una cuenta con su historial de pagos y (si aplica) sus cuotas hijas. */
export interface CuentaFinancieraDetalle extends CuentaFinancieraBase {
  banco: string | null
  cuotas: CuotaHija[]
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
  /** Si viene, lista las cuotas hijas de esa cabecera; si no, solo primer nivel. */
  idPadre?: number
  pagina?: number
  limite?: number
}

export interface RegistrarPagoPayload {
  idCuenta: number
  monto: number
  fechaPago?: string
  idMedioPago?: number
  /** Cuenta bancaria de la empresa afectada (nuevo). */
  idCuentaBancaria?: number
  /** N° de operación / cheque (nuevo). */
  numeroOperacion?: string
  referencia?: string
  observacion?: string
  idUsuarioAuditoria?: number
}

export interface CrearCuentaPayload {
  /** Cliente/proveedor de cli_clientes. Puede omitirse si viene `terceroNombre`. */
  idTercero?: number
  /** Nombre libre del tercero (alternativa a idTercero). */
  terceroNombre?: string
  fechaEmision: string
  fechaVencimiento?: string
  monto: number
  descripcion?: string
  observacion?: string
  numeroComprobante?: string
  /** Solo para préstamos bancarios. */
  idBanco?: number
  tasaInteres?: number
  idUsuarioAuditoria?: number
}

export interface ActualizarCuentaPayload {
  idTercero?: number
  terceroNombre?: string
  fechaEmision?: string
  fechaVencimiento?: string
  monto?: number
  descripcion?: string
  observacion?: string
  numeroComprobante?: string
  idUsuarioAuditoria?: number
}

/** Payload para crear una cuenta con plan de cuotas (cabecera + N hijas).
 *  La cuota 1 usa `fechaPrimeraCuota` tal cual; las siguientes se agendan al
 *  día `diaMesPago` de cada mes (acotado al último día si el mes no tiene ese día). */
export interface CrearCuentaCuotasPayload {
  idTercero?: number
  terceroNombre?: string
  fechaEmision: string
  montoTotal: number
  numeroCuotas: number
  fechaPrimeraCuota: string
  diaMesPago: number
  descripcion?: string
  observacion?: string
  numeroComprobante?: string
  idBanco?: number
  tasaInteres?: number
  idUsuarioAuditoria?: number
}
