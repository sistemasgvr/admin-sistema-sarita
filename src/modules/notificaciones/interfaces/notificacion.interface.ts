export interface Notificacion {
  id: number
  id_usuario: number
  codigo_tipo: string
  titulo: string
  mensaje?: string | null
  payload?: Record<string, unknown> | null
  id_referencia?: number | null
  tipo_referencia?: string | null
  clave_dedupe?: string | null
  leida: boolean
  fecha_lectura?: string | null
  fecha_creacion?: string
  fecha_modificacion?: string
}

export interface NotificacionListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  soloNoLeidas?: number
}

export interface ContadorNoLeidas {
  total: number
}
