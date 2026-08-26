export interface ActividadItem {
  id?: number
  item?: number
  id_producto?: number | null
  nombre_producto?: string | null
  descripcion?: string | null
  cantidad: number
  id_balon?: number | null
  codigo_balon?: string | null
}

export interface Actividad {
  id: number
  titulo: string
  descripcion?: string | null
  fecha_programada: string
  hora_inicio_estimada: string
  hora_fin_estimada: string
  fecha_hora_cierre?: string | null
  id_tipo_actividad: number
  nombre_tipo_actividad?: string | null
  id_prioridad: number
  nombre_prioridad?: string | null
  id_cliente?: number | null
  razon_social_cliente?: string | null
  latitud_cliente?: number | null
  longitud_cliente?: number | null
  id_usuario_responsable?: number | null
  nombre_usuario_responsable?: string | null
  id_chofer_responsable?: number | null
  nombre_chofer_responsable?: string | null
  id_trabajador_responsable?: number | null
  nombre_trabajador_responsable?: string | null
  id_comprobante?: number | null
  serie_comprobante?: string | null
  numero_comprobante?: string | null
  id_guia_remision?: number | null
  serie_guia_remision?: string | null
  numero_guia_remision?: string | null
  id_estado_actividad: number
  nombre_estado_actividad?: string | null
  observaciones?: string | null
  estado?: number
  fecha_creacion: string
  fecha_modificacion: string
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  items?: ActividadItem[]
  en_curso?: boolean
}

/** Filtros soportados por GET /operativa/actividades */
export interface ActividadListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  fechaDesde?: string
  fechaHasta?: string
  idEstado?: number
  idTipo?: number
  idPrioridad?: number
  sinResponsable?: boolean
}

export interface ActividadItemPayload {
  item?: number
  idProducto?: number
  descripcion?: string
  cantidad?: number
  idBalon?: number
}

/** Body compartido por POST y PATCH /operativa/actividades */
export interface ActividadPayload {
  idUsuarioAuditoria: number
  titulo: string
  descripcion?: string
  fechaProgramada: string
  horaInicioEstimada: string
  horaFinEstimada: string
  fechaHoraCierre?: string
  idTipoActividad: number
  idPrioridad: number
  idCliente?: number
  idTrabajadorResponsable?: number
  idComprobante?: number
  idGuiaRemision?: number
  items?: ActividadItemPayload[]
  idEstadoActividad: number
  observaciones?: string
}

export type CreateActividadPayload = ActividadPayload
export type UpdateActividadPayload = ActividadPayload

export interface DeleteActividadResponse {
  eliminado: boolean
  id: number
}

export type ActividadFormMode = 'create' | 'edit'

/** Prefill al crear un reparto desde una venta o guía de remisión. */
export interface ActividadRepartoPrefill {
  titulo?: string | null
  clienteId?: number | null
  clienteLabel?: string | null
  idComprobante?: number | null
  idGuiaRemision?: number | null
  guiaLabel?: string | null
  choferId?: number | null
  choferLabel?: string | null
  descripcion?: string | null
  items?: ActividadItem[]
}
