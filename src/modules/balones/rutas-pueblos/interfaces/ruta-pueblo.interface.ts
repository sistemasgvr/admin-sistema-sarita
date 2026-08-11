export type EstadoRutaPuebloNombre = 'ABIERTA' | 'EN_RUTA' | 'CERRADA' | 'CANCELADA'

export interface RutaPuebloDetalle {
  id: number
  id_ruta_pueblo: number
  id_balon: number
  codigo_balon?: string | null
  nombre_tipo_balon?: string | null
  capacidad_tipo?: number | string | null
  sellado: boolean
  lb_salida: number | string
  lb_retorno?: number | string | null
  m3_delta?: number | string | null
  capacidad_restante_m3?: number | string | null
  observacion?: string | null
}

export interface RutaPueblo {
  id: number
  fecha: string
  id_almacen: number
  nombre_almacen?: string | null
  id_usuario_responsable?: number | null
  nombre_usuario_responsable?: string | null
  id_chofer?: number | null
  nombre_chofer?: string | null
  factor_lb_m3: number | string
  tolerancia_m3: number | string
  m3_reportado_ventas?: number | string | null
  m3_calculado?: number | string | null
  descuadre_m3?: number | string | null
  id_estado?: number | null
  nombre_estado?: EstadoRutaPuebloNombre | string | null
  observacion?: string | null
  total_cilindros?: number
  total_retornados?: number
  detalles?: RutaPuebloDetalle[]
}

export interface RutaPuebloListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  estadoNombre?: string
  idAlmacen?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface CreateRutaPuebloPayload {
  idUsuarioAuditoria: number
  fecha?: string
  idAlmacen: number
  idUsuarioResponsable?: number
  idChofer?: number
  factorLbM3?: number
  toleranciaM3?: number
  observacion?: string
  detalles: {
    idBalon: number
    lbSalida: number
    sellado?: boolean
    observacion?: string
  }[]
}

export interface UpdateRutaPuebloPayload {
  idUsuarioAuditoria: number
  fecha?: string
  idAlmacen?: number
  idUsuarioResponsable?: number
  idChofer?: number
  factorLbM3?: number
  toleranciaM3?: number
  estadoNombre?: string
  observacion?: string
}

export interface RegistrarRetornoRutaPuebloPayload {
  idUsuarioAuditoria: number
  detalles: { idBalon: number; lbRetorno: number; observacion?: string }[]
}

export interface CerrarRutaPuebloPayload {
  idUsuarioAuditoria: number
  m3ReportadoVentas: number
  observacion?: string
}

export interface DeleteRutaPuebloResponse {
  eliminado: boolean
  id: number
  error?: string
}
