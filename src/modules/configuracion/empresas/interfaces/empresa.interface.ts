export interface Empresa {
  id: number
  ruc: string
  razon_social?: string
  nombre_comercial?: string
  direccion?: string
  telefono?: string
  email?: string
  tolerancia_m3_ruta_pueblo?: number | string | null
  psi_minimo_util?: number | string | null
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
  toleranciaM3RutaPueblo?: number
  psiMinimoUtil?: number
}

export interface UpdateEmpresaPayload {
  ruc?: string
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  telefono?: string
  email?: string
  toleranciaM3RutaPueblo?: number
  psiMinimoUtil?: number
}

export interface DeleteEmpresaResponse {
  eliminado: boolean
  id: number
}

export type EmpresaFormMode = 'create' | 'edit'
