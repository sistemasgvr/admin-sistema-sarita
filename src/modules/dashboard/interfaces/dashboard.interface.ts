/**
 * Tipos de la respuesta del endpoint GET /dashboard/clientes.
 * Reflejan la forma que arma la función SQL dash_clientes_con_deuda.
 */

export interface DeudaProducto {
  idProducto: number
  nombre: string
  cantidad: number
  importe: number
}

export interface DeudaComprobante {
  idCuenta: number
  idComprobante: number | null
  serie: string | null
  numero: string | null
  fechaEmision: string | null
  fechaVencimiento: string | null
  montoSaldo: number
  productos: DeudaProducto[]
}

export interface ClienteConDeuda {
  idCliente: number
  razonSocial: string | null
  nombres: string | null
  numeroDocumento: string | null
  montoTotalDeuda: number
  comprobantes: DeudaComprobante[]
}

export interface ClientesConDeuda {
  cantidad: number
  detalle: ClienteConDeuda[]
}

export interface ClientesDashboard {
  totalClientes: number
  clientesConDeuda: ClientesConDeuda
}

/* ---------- Dashboard Balones ---------- */

export interface GrupoBalones<T> {
  cantidad: number
  detalle: T[]
}

export interface BalonEnAlmacen {
  idBalon: number
  codigoBalon: string
  tipoBalon: string | null
  idAlmacen: number | null
  almacen: string | null
}

export interface BalonPrestado {
  idBalon: number
  codigoBalon: string
  tipoBalon: string | null
  idCliente: number | null
  cliente: string | null
  fechaPrestamo: string | null
  fechaVencimiento: string | null
}

export interface BalonAlquilado {
  idBalon: number
  codigoBalon: string
  tipoBalon: string | null
  idCliente: number | null
  cliente: string | null
  fechaInicio: string | null
  fechaFinPactada: string | null
}

export interface BalonMantenimiento {
  idBalon: number
  codigoBalon: string
  tipoBalon: string | null
  tipoMantenimiento: string | null
  fechaIngreso: string | null
  esExterno: boolean | null
}

export interface BalonPhPorVencer {
  idBalon: number
  codigoBalon: string
  tipoBalon: string | null
  fechaProximaPh: string | null
  diasRestantes: number
  vencido: boolean
}

export interface BalonesDashboard {
  totalBalones: number
  enAlmacen: GrupoBalones<BalonEnAlmacen>
  prestados: GrupoBalones<BalonPrestado>
  alquilados: GrupoBalones<BalonAlquilado>
  mantenimiento: GrupoBalones<BalonMantenimiento>
  phPorVencer: GrupoBalones<BalonPhPorVencer>
}
