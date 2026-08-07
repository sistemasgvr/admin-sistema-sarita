export type EstadoGarantia = 'ACTIVA' | 'DEVUELTA'

export interface Garantia {
  id: number
  fecha: string
  id_cliente: number
  cliente: string
  documento_cliente: string | null
  /** Método con el que el cliente PAGÓ la garantía. */
  id_medio_pago: number | null
  medio_pago: string | null
  importe: number
  observacion: string | null
  /** Datos del reembolso (opcional, nulos hasta que se reembolse). */
  fecha_reembolso: string | null
  id_medio_reembolso: number | null
  medio_reembolso: string | null
  observacion_reembolso: string | null
  /** Estado calculado (viene como texto en la respuesta). */
  id_estado?: number | null
  estado_texto?: EstadoGarantia | null
  fecha_creacion?: string
}

export interface GarantiaListFilters {
  buscar?: string
  idCliente?: number
  desde?: string
  hasta?: string
  estado?: EstadoGarantia
  pagina?: number
  limite?: number
}

export interface CrearGarantiaPayload {
  fecha: string
  idCliente: number
  idMedioPago?: number
  importe: number
  observacion?: string
  idUsuarioAuditoria?: number
}

export interface ActualizarGarantiaPayload {
  fecha?: string
  idCliente?: number
  idMedioPago?: number
  importe?: number
  observacion?: string
  idUsuarioAuditoria?: number
}

export interface ReembolsarGarantiaPayload {
  fechaReembolso: string
  idMedioReembolso: number
  observacionReembolso?: string
  idUsuarioAuditoria?: number
}

/** Respuesta del endpoint de verificación de duplicados. */
export interface DuplicadoPagoInfo {
  duplicado: boolean
  severidad?: 'alta' | 'media'
  mensaje?: string
  pagoExistente?: {
    id: number
    idCuenta: number
    fechaPago: string
    monto: number
    numeroComprobante?: string | null
  }
}

export interface VerificarDuplicadoPagoPayload {
  idCuenta: number
  fechaPago: string
  monto: number
  diasVentana?: number
  numeroComprobante?: string
}
