export interface ConfiguracionServicio {
  id: number
  codigo: string
  nombre: string
  usuario?: string
  tiene_contrasena: boolean
  email?: string
  url?: string
  observacion?: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
}

export interface ConfiguracionServicioListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface CreateConfiguracionServicioPayload {
  codigo: string
  nombre: string
  usuario?: string
  contrasena?: string
  email?: string
  url?: string
  observacion?: string
}

export interface UpdateConfiguracionServicioPayload {
  codigo?: string
  nombre?: string
  usuario?: string
  contrasena?: string
  email?: string
  url?: string
  observacion?: string
}

export interface DeleteConfiguracionServicioResponse {
  eliminado: boolean
  id: number
}

export type ConfiguracionServicioFormMode = 'create' | 'edit'
