export interface AuthRole {
  id: number
  nombre: string
}

export interface AuthUser {
  id: number
  nombre: string
  correo: string
  estado: boolean
  roles: AuthRole[]
  permisos: string[]
}

export interface AuthSession {
  id: number
  id_usuario: number
  nombre_usuario: string
  correo: string
  fecha_inicio: string
}

export interface LoginPayload {
  correo: string
  contrasena: string
}

export interface LoginResponse {
  token: string
  usuario: AuthUser
}

export interface AuthMeResponse {
  id: number
  correo: string
  permisos: string[]
  sesion: AuthSession
}

export interface LogoutResponse {
  cerrada: boolean
}
