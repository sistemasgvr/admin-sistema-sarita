export type CondicionPagoModalidad = 'CONTADO' | 'CREDITO' | 'CUOTAS'

export interface CondicionPago {
  id: number
  codigo: string
  nombre: string
  dias_credito: number
  numero_cuotas?: number | null
  dia_mes_pago?: number | null
  modalidad?: CondicionPagoModalidad
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
}

export interface CondicionPagoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface CreateCondicionPagoPayload {
  codigo: string
  nombre: string
  diasCredito: number
  numeroCuotas?: number | null
  diaMesPago?: number | null
}

export interface UpdateCondicionPagoPayload {
  codigo?: string
  nombre?: string
  diasCredito?: number
  numeroCuotas?: number | null
  diaMesPago?: number | null
}

export interface DeleteCondicionPagoResponse {
  eliminado: boolean
  id: number
}

export type CondicionPagoFormMode = 'create' | 'edit'
