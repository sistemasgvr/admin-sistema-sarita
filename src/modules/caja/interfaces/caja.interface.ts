export interface CajaTotales {
  ventasContado: number
  ventasCredito: number
  ventasMediosCaja: number
  /** Fase 3: desglose del cobro de ventas por naturaleza del medio. */
  ventasEfectivo?: number
  ventasOtrosMedios?: number
  cobranzas: number
  cobranzasMediosCaja: number
  cobranzasEfectivo?: number
  gastosCaja: number
  /** Gastos pagados con medios que afectan caja: los únicos que vacían el cajón. */
  gastosCajaMediosCaja?: number
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
  idCuentaBancaria?: number | null
  cuentaBancaria?: string | null
  idCategoriaGasto?: number | null
  categoriaGasto?: string | null
  numeroOperacion?: string | null
  observacion?: string | null
  idSesion?: number | null
  estado?: number
}

export interface CajaGastosListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  fechaDesde?: string
  fechaHasta?: string
  idCategoriaGasto?: number
  idSesion?: number
  estado?: number
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
  /** Sesión CERRADA a reabrir (botón Reabrir caja). */
  idSesion?: number | null
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
  /** Cuenta de la empresa de la que sale el dinero (obligatoria si el medio no es efectivo). */
  idCuentaBancaria?: number | null
  idCategoriaGasto?: number | null
  numeroOperacion?: string
  observacion?: string
  idSesion?: number | null
  idSucursal?: number | null
  idUsuarioAuditoria?: number
}

export interface ActualizarCajaGastoPayload {
  concepto: string
  monto: number
  idMedioPago?: number | null
  /** Cuenta de la empresa de la que sale el dinero (obligatoria si el medio no es efectivo). */
  idCuentaBancaria?: number | null
  idCategoriaGasto?: number | null
  numeroOperacion?: string
  observacion?: string
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

/**
 * Una linea de cobro de una venta (Fase 3). Una venta cobrada mitad en efectivo
 * y mitad por transferencia produce dos filas, cada una en su pestana.
 */
export interface LibroDiarioVentaPago {
  idComprobante: number
  idPago?: number | null
  item: number
  fecha: string
  tipoComprobante?: string | null
  serieNumero?: string | null
  idCliente?: number | null
  cliente?: string | null
  idMedioPago?: number | null
  medioPago?: string | null
  idCuentaBancaria?: number | null
  cuentaBancaria?: string | null
  numeroOperacion?: string | null
  monto: number
  /** DETALLE = linea real; CABECERA = derivada del medio de pago del comprobante. */
  origen: 'DETALLE' | 'CABECERA'
  grupo: 'EFECTIVO' | 'OTROS' | 'CREDITO'
}

export interface LibroDiarioGarantia {
  id: number
  fecha: string
  tipo: 'COBRO' | 'DEVOLUCION'
  idGarantia: number
  monto: number
  idMedioPago?: number | null
  medioPago?: string | null
  idCuentaBancaria?: number | null
  cuentaBancaria?: string | null
  numeroOperacion?: string | null
  idCliente?: number | null
  cliente?: string | null
  observacion?: string | null
}

/**
 * Definicion de una pestana del historial de caja. La sirve el backend
 * (`fin_obtener_libro_diario`) en vez de estar escrita aqui, para que anadir un
 * resumen no obligue a tocar el componente.
 */
export interface LibroDiarioResumen {
  clave: string
  etiqueta: string
  /** Array del payload del que salen las filas de esta pestana. */
  coleccion: 'ventasPagos' | 'cobranzas' | 'gastos' | 'depositos' | 'garantias' | 'observaciones'
  /** Campo por el que filtrar esa coleccion (null = toda). */
  filtroCampo?: string | null
  filtroValor?: string | null
  /** +1 entra a caja, -1 sale, 0 no la mueve. */
  signo: number
  total: number | null
  cantidad: number
  orden: number
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
  idCuentaBancaria?: number | null
  cuentaBancaria?: string | null
}

export interface LibroDiarioGasto {
  id: number
  fecha: string
  origen: 'CAJA' | 'COMPRA' | string
  concepto: string
  monto: number
  idMedioPago?: number | null
  medioPago?: string | null
  idCuentaBancaria?: number | null
  cuentaBancaria?: string | null
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
  /** Fase 3: una fila por linea de cobro, para las pestanas de ventas. */
  ventasPagos?: LibroDiarioVentaPago[]
  cobranzas: LibroDiarioCobranza[]
  gastos: LibroDiarioGasto[]
  depositos: LibroDiarioDeposito[]
  garantias?: LibroDiarioGarantia[]
  observaciones: LibroDiarioObservacion[]
  /** Fase 3: definicion de las pestanas del historial. */
  resumenes?: LibroDiarioResumen[]
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
