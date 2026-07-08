export interface Contacto {
  id: number
  id_cliente: number
  cliente_razon_social?: string | null
  cliente_nombres?: string | null
  cliente_apellido_paterno?: string | null
  cliente_apellido_materno?: string | null
  cliente_numero_documento?: string | null
  nombre: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  direccion?: string | null
  email?: string | null
  telefono1?: string | null
  telefono2?: string | null
  telefono3?: string | null
  es_principal: boolean
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export type ContactoEstadoFiltro = 'activos' | 'inactivos' | 'todos'

export interface ContactoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  soloActivos?: number | null
  idCliente?: number
}

export interface ContactoPayload {
  idUsuarioAuditoria: number
  idCliente: number
  nombre: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  direccion?: string
  email?: string
  telefono1?: string
  telefono2?: string
  telefono3?: string
  esPrincipal?: boolean
}

export type CreateContactoPayload = ContactoPayload
export type UpdateContactoPayload = ContactoPayload

export interface DeleteContactoResponse {
  eliminado: boolean
  id: number
}

export type ContactoFormMode = 'create' | 'edit'
