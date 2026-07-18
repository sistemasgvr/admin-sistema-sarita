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
  id_usuario_responsable?: number | null
  nombre_usuario_responsable?: string | null
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
}

/** Filtros soportados por GET /operativa/actividades */
export interface ActividadListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  fechaDesde?: string
  fechaHasta?: string
  idEstado?: number
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
  idUsuarioResponsable?: number
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

/** Respuesta cruda del backend para GET /operativa/actividades (antes de normalizar). */
export interface ActividadListRawData {
  registros: Actividad[]
  total: number
}

/** Respuesta cruda del backend para GET/POST/PATCH de un solo registro. */
export interface ActividadRegistroRawData {
  registro: Actividad
}
