export interface CajaTotales {
  ventasContado: number
  ventasCredito: number
  ventasMediosCaja: number
  cobranzas: number
  cobranzasMediosCaja: number
  gastosCaja: number
  gastosCompra: number
  gastos: number
  depositos: number
  garantiasCobro?: number
  garantiasCobroMediosCaja?: number
  garantiasDevolucion?: number
  garantiasDevolucionMediosCaja?: number
}

export interface CajaMovimientoGasto {
  id: number
  fecha: string
  concepto: string
  monto: number
  idMedioPago?: number | null
  medioPago?: string | null
  numeroOperacion?: string | null
  observacion?: string | null
}

export interface CajaMovimientoDeposito {
  id: number
  fecha: string
  monto: number
  idCuentaBancaria?: number | null
  cuentaBancaria?: string | null
  idMedioPago?: number | null
  medioPago?: string | null
  numeroOperacion?: string | null
  observacion?: string | null
}

export interface CajaSesion {
  id: number | null
  fecha: string
  idSucursal?: number | null
  nombreSucursal?: string | null
  idEstado?: number | null
  estadoCaja?: string | null
  montoInicial: number
  montoEfectivoContado?: number | null
  montoEsperado?: number | null
  diferencia?: number | null
  observacionApertura?: string | null
  observacionCierre?: string | null
  fechaApertura?: string | null
  fechaCierre?: string | null
  idUsuarioApertura?: number | null
  usuarioApertura?: string | null
  idUsuarioCierre?: number | null
  usuarioCierre?: string | null
  totales?: CajaTotales
  cajaEsperada?: number
  gastos?: CajaMovimientoGasto[]
  depositos?: CajaMovimientoDeposito[]
}

export interface AbrirCajaPayload {
  fecha: string
  montoInicial: number
  idSucursal?: number | null
  observacion?: string
  idUsuarioAuditoria?: number
}

export interface CerrarCajaPayload {
  montoEfectivoContado: number
  observacion?: string
  idUsuarioAuditoria?: number
}

export interface CrearCajaGastoPayload {
  fecha: string
  concepto: string
  monto: number
  idMedioPago?: number | null
  numeroOperacion?: string
  observacion?: string
  idSesion?: number | null
  idSucursal?: number | null
  idUsuarioAuditoria?: number
}

export interface CrearCajaDepositoPayload {
  fecha: string
  monto: number
  idCuentaBancaria?: number | null
  idMedioPago?: number | null
  numeroOperacion?: string
  observacion?: string
  idSesion?: number | null
  idSucursal?: number | null
  idUsuarioAuditoria?: number
}

export interface CrearCajaObservacionPayload {
  fecha: string
  texto: string
  idUsuarioAuditoria?: number
}

export interface LibroDiarioVenta {
  id: number
  fecha: string
  tipoComprobante?: string
  serie?: string
  numero?: string
  serieNumero?: string
  idCliente?: number
  cliente?: string
  medioPago?: string
  esCredito?: boolean
  totalImporte: number
  detalleProductos?: string
}

export interface LibroDiarioCobranza {
  id: number
  fechaPago: string
  monto: number
  medioPago?: string
  numeroOperacion?: string
  observacion?: string
  idCuenta?: number
  cliente?: string
  idCliente?: number | null
}

export interface LibroDiarioGasto {
  id: number
  fecha: string
  origen: 'CAJA' | 'COMPRA' | string
  concepto: string
  monto: number
  medioPago?: string | null
  observacion?: string | null
}

export interface LibroDiarioDeposito {
  id: number
  fecha: string
  monto: number
  cuentaBancaria?: string | null
  medioPago?: string | null
  numeroOperacion?: string | null
  observacion?: string | null
}

export interface LibroDiarioObservacion {
  id: number
  fecha: string
  texto: string
  usuario?: string | null
  fechaCreacion?: string
}

export interface LibroDiario {
  fechaDesde: string
  fechaHasta: string
  idCliente?: number | null
  idSucursal?: number | null
  ventas: LibroDiarioVenta[]
  cobranzas: LibroDiarioCobranza[]
  gastos: LibroDiarioGasto[]
  depositos: LibroDiarioDeposito[]
  observaciones: LibroDiarioObservacion[]
  totales: CajaTotales
  dias?: Array<{ fecha: string; totales: CajaTotales }>
}

export interface LibroDiarioFilters {
  fechaDesde: string
  fechaHasta?: string
  idCliente?: number | null
  idSucursal?: number | null
}

export interface CajaSesionesListFilters {
  fechaDesde?: string
  fechaHasta?: string
  estadoCaja?: string
  idSucursal?: number | null
  pagina?: number
  limite?: number
}

export interface CajaPendienteCierre {
  id: number
  fecha: string
  idSucursal?: number | null
  nombreSucursal?: string | null
  estadoCaja?: string | null
  montoInicial?: number
  fechaApertura?: string | null
  usuarioApertura?: string | null
  diasAbierta?: number
}
