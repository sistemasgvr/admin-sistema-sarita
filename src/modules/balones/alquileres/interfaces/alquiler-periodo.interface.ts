export interface AlquilerPeriodo {
  id: number
  id_alquiler: number
  numero_periodo: number
  fecha_inicio: string
  fecha_fin: string
  monto: number
  id_producto?: number | null
  codigo_producto?: string | null
  nombre_producto?: string | null
  id_comprobante?: number | null
  comprobante?: string | null
  id_estado?: number | null
  nombre_estado?: string | null
  observacion?: string | null
  fecha_creacion?: string | null
}

export interface RegistrarAlquilerPeriodoPayload {
  idUsuarioAuditoria: number
  fechaInicio: string
  fechaFin: string
  monto?: number
  idProducto?: number
  idComprobante?: number
  observacion?: string
}

export interface RenovarAlquilerPayload {
  idUsuarioAuditoria: number
  idComprobante: number
  monto?: number
  fechaInicio?: string
  fechaFin?: string
  observacion?: string
}
