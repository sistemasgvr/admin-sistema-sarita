export interface Alquiler {
  id: number
  numero_alquiler: string
  id_cliente: number
  nombre_cliente?: string | null
  id_almacen: number
  nombre_almacen?: string | null
  fecha_inicio: string
  fecha_fin_pactada?: string | null
  fecha_fin_real?: string | null
  tarifa_diaria?: number | null
  total_cobrado?: number | null
  id_estado?: number | null
  nombre_estado?: string | null
  observacion?: string | null
  id_comprobante_venta?: number | null
  total_detalles?: number | null
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string | null
}

export interface AlquilerListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idCliente?: number
  idAlmacen?: number
  idEstado?: number
}

export interface CreateAlquilerPayload {
  idUsuarioAuditoria: number
  numeroAlquiler: string
  idCliente: number
  idAlmacen: number
  fechaInicio: string
  fechaFinPactada?: string
  fechaFinReal?: string
  tarifaDiaria?: number
  totalCobrado?: number
  idEstado?: number
  observacion?: string
  idComprobanteVenta?: number
}

export interface UpdateAlquilerPayload {
  idUsuarioAuditoria: number
  numeroAlquiler?: string
  idCliente?: number
  idAlmacen?: number
  fechaInicio?: string
  fechaFinPactada?: string
  fechaFinReal?: string
  tarifaDiaria?: number
  totalCobrado?: number
  idEstado?: number
  observacion?: string
  idComprobanteVenta?: number
}

export interface DeleteAlquilerResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type AlquilerFormMode = 'create' | 'edit'
