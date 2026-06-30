export interface CondicionPago {
  id: number
  codigo: string
  nombre: string
  dias_credito: number
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
}

export interface UpdateCondicionPagoPayload {
  codigo?: string
  nombre?: string
  diasCredito?: number
}

export interface DeleteCondicionPagoResponse {
  eliminado: boolean
  id: number
}

export type CondicionPagoFormMode = 'create' | 'edit'
