export interface UsuarioRol {
  id: number
  nombre: string
  descripcion?: string
}

export interface Usuario {
  id: number
  nombre: string
  correo: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
  roles: UsuarioRol[]
}

export interface UsuarioListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface CreateUsuarioPayload {
  nombre: string
  correo: string
  contrasena: string
}

export interface UpdateUsuarioPayload {
  nombre?: string
  correo?: string
  contrasena?: string
}

export interface DeleteUsuarioResponse {
  eliminado: boolean
  id: number
}

export type UsuarioFormMode = 'create' | 'edit'

export interface UsuarioRolAsignacion {
  id: number
  id_usuario: number
  nombre_usuario: string
  correo: string
  id_rol: number
  nombre_rol: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
}

export interface UsuarioRolListFilters {
  idUsuario?: number
  idRol?: number
  pagina?: number
  limite?: number
}

export interface AsignarUsuarioRolPayload {
  idUsuario: number
  idRol: number
}
