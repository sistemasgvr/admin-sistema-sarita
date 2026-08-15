import type { Stock } from '@/modules/productos/stock/interfaces/stock.interface'

export interface DashboardRangoFechasQueryParams {
  fechaDesde?: string
  fechaHasta?: string
}

export interface DashboardCantidadDetalle {
  cantidad: number
  detalle: unknown[]
}

export interface DashboardComprobanteDeudaProducto {
  idProducto: number
  nombre: string
  cantidad: number
  importe: number
}

export interface DashboardComprobanteDeuda {
  idCuenta: number
  idComprobante: number | null
  serie: string | null
  numero: string | null
  fechaEmision: string
  fechaVencimiento: string | null
  montoSaldo: number
  diasRetraso: number
  estadoPago: 'VENCIDO' | 'CORRIENTE'
  productos: DashboardComprobanteDeudaProducto[]
}

export interface DashboardClienteConDeuda {
  idCliente: number
  razonSocial: string | null
  nombres: string | null
  numeroDocumento: string | null
  montoTotalDeuda: number
  comprobantes: DashboardComprobanteDeuda[]
}

export interface DashboardClientesConDeudaDetalle {
  cantidad: number
  detalle: DashboardClienteConDeuda[]
}

export interface DashboardClientesKpi {
  totalClientes: number
  clientesConDeuda: DashboardClientesConDeudaDetalle
}

export interface DashboardBalonesEnvasesCampo {
  cantidad: number
  retrasoCritico: number
}

export interface DashboardBalonPhPorVencer {
  idBalon: number
  codigoBalon: string
  tipoBalon: string | null
  fechaProximaPh: string
  diasRestantes: number
  vencido: boolean
}

export interface DashboardPhPorVencerDetalle {
  cantidad: number
  detalle: DashboardBalonPhPorVencer[]
}

export interface DashboardBalonesKpi {
  totalBalones: number
  enAlmacen: DashboardCantidadDetalle
  prestados: DashboardCantidadDetalle
  alquilados: DashboardCantidadDetalle
  mantenimiento: DashboardCantidadDetalle
  phPorVencer: DashboardPhPorVencerDetalle
  envasesEnCampo: DashboardBalonesEnvasesCampo
}

export interface DashboardClientesQueryParams {
  idCliente?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface DashboardBalonesQueryParams {
  diasAlerta?: number
  idCliente?: number
}

export interface DashboardVentasNetasQueryParams {
  idCliente?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface DashboardComprasNetasQueryParams {
  fechaDesde?: string
  fechaHasta?: string
}

export interface DashboardVentasNetasKpi {
  totalVentasNetas: number
}

export interface DashboardComprasNetasKpi {
  totalComprasNetas: number
}

export interface DashboardDeudaQueryParams {
  idCliente?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface DashboardDeudaKpi {
  totalPendiente: number
  cantidadCuentas: number
  totalVencido: number
  cantidadVencidas: number
  cantidadTerceros: number
  totalCobrado: number
  totalPagado: number
  /** Solo presente para tipo COBRAR: cobrado / (cobrado + pendiente) del periodo. */
  eficienciaCobranza?: number
}

// ---------- Rentabilidad ----------

export interface DashboardRentabilidadKpi {
  ventasNetas: number
  comprasNetas: number
  rentabilidad: number
}

// ---------- Histórico ventas vs compras ----------

export interface DashboardHistoricoQueryParams {
  anio?: number
}

export interface DashboardHistoricoMes {
  mes: number
  nombreMes: string
  ventas: number
  compras: number
}

export interface DashboardHistoricoKpi {
  anio: number
  meses: DashboardHistoricoMes[]
}

// ---------- Top clientes por volumen de venta ----------

export interface DashboardTopClientesVentaQueryParams {
  fechaDesde?: string
  fechaHasta?: string
  limite?: number
}

export interface DashboardTopClienteVenta {
  idCliente: number
  cliente: string
  cantidadComprobantes: number
  totalVenta: number
}

export interface DashboardTopClientesVentaKpi {
  fechaDesde: string
  fechaHasta: string
  detalle: DashboardTopClienteVenta[]
}

// ---------- Demanda de gases ----------

export interface DashboardDemandaGasProducto {
  idProducto: number
  producto: string
  cantidad: number
  porcentaje: number
}

export interface DashboardDemandaGasesKpi {
  totalCantidad: number
  detalle: DashboardDemandaGasProducto[]
}

// ---------- Volumen de venta de gases: mes actual vs anterior ----------

export interface DashboardGasesComparativoQueryParams {
  anio?: number
  mes?: number
}

export interface DashboardMesRef {
  anio: number
  mes: number
}

export interface DashboardGasComparativoProducto {
  idProducto: number
  producto: string
  cantidadActual: number
  cantidadAnterior: number
}

export interface DashboardGasesComparativoKpi {
  mesActual: DashboardMesRef
  mesAnterior: DashboardMesRef
  detalle: DashboardGasComparativoProducto[]
}


// ---------- Clientes en mora ----------

export interface DashboardClientesMoraQueryParams {
  fechaDesde?: string
  fechaHasta?: string
  diasUrgente?: number
}

export interface DashboardClienteMoraDetalle {
  idCliente: number
  cliente: string
  montoVencido: number
  diasRetraso: number
  urgente: boolean
}

export interface DashboardClientesMoraKpi {
  cantidadDeudoresMora: number
  cantidadUrgentes: number
  diasUrgente: number
  detalle: DashboardClienteMoraDetalle[]
}

// ---------- Bajas de balones solicitadas ----------

export interface DashboardBajaBalonSolicitada {
  idBaja: number
  idBalon: number
  codigoBalon: string
  motivo: string | null
  motivoDetalle: string | null
  fechaBaja: string
  usuarioSolicita: string | null
}

export interface DashboardBalonesBajasKpi {
  cantidad: number
  detalle: DashboardBajaBalonSolicitada[]
}

// ---------- Garantías por alquiler ----------

export interface DashboardGarantiasAlquilerKpi {
  totalEnCaja: number
  contratosActivos: number
  porDevolverClientes: number
  ingresadoEsteMes: number
  balonesEnCampo: number
  totalBalones: number
  porcentajeBalonesEnCampo: number
}

// ---------- Productos / Inventario ----------

export interface DashboardIdAlmacenQueryParams {
  idAlmacen?: number
}

export interface DashboardProductosKpi {
  totalProductos: {
    total: number
    accesorios: number
    gases: number
    servicios: number
  }
  totalAlmacenes: number
  valorTotalInventario: number
  margenPromedio: number
}

export interface DashboardStockCategoriaDetalle {
  idCategoria: number | null
  categoria: string
  valor: number
  porcentaje: number
}

export interface DashboardStockCategoriaKpi {
  valorTotal: number
  detalle: DashboardStockCategoriaDetalle[]
}

export type DashboardNivelRotacion = 'SIN_STOCK' | 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA'

export interface DashboardVelocidadSalidaQueryParams {
  fechaDesde?: string
  fechaHasta?: string
  idAlmacen?: number
  limite?: number
}

export interface DashboardVelocidadSalidaProducto {
  idProducto: number
  producto: string
  categoria: string
  stockActual: number
  cantidadVendida: number
  rotacion: number | null
  nivelRotacion: DashboardNivelRotacion
  margenUnitario: number | null
}

export interface DashboardVelocidadSalidaKpi {
  detalle: DashboardVelocidadSalidaProducto[]
}

export interface DashboardStockCriticoQueryParams {
  idAlmacen?: number
  limite?: number
}

export interface DashboardStockCriticoResumen {
  total_items: number
  bajo_minimo: number
  ok: number
  stock_total: number
}

export interface DashboardStockCriticoKpi {
  registros: Stock[]
  total: number
  resumen: DashboardStockCriticoResumen
}