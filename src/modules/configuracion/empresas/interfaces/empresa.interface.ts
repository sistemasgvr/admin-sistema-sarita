export interface Empresa {
  id: number
  ruc: string
  razon_social?: string
  nombre_comercial?: string
  direccion?: string
  telefono?: string
  email?: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
}

export interface EmpresaListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface CreateEmpresaPayload {
  ruc: string
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  telefono?: string
  email?: string
}

export interface UpdateEmpresaPayload {
  ruc?: string
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  telefono?: string
  email?: string
}

export interface DeleteEmpresaResponse {
  eliminado: boolean
  id: number
}

export type EmpresaFormMode = 'create' | 'edit'
