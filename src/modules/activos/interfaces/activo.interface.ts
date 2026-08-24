export interface Activo {
  id: number
  id_tipo?: number | null
  nombre_tipo?: string | null
  descripcion?: string | null
  fecha_compra?: string | null
  importe?: number | null
  id_sucursal?: number | null
  nombre_sucursal?: string | null
  marca?: string | null
  modelo?: string | null
  numero_serie?: string | null
  id_trabajador_responsable?: number | null
  nombre_trabajador_responsable?: string | null
  imagen_principal_ruta?: string | null
  url_imagen_principal?: string | null
  estado: number
  fecha_creacion: string
  fecha_modificacion: string
}

export interface ActivoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  estado?: number | null
  idTipo?: number
  idSucursal?: number
  fechaDesde?: string
  fechaHasta?: string
  importeMin?: number
  importeMax?: number
  incluirImagenes?: boolean
}

export interface ActivoPayload {
  idUsuarioAuditoria: number
  idTipo?: number
  descripcion?: string
  fechaCompra?: string
  importe?: number
  idSucursal?: number
  marca?: string
  modelo?: string
  numeroSerie?: string
  idTrabajadorResponsable?: number
  imagenPrincipalRuta?: string
}

export type CreateActivoPayload = ActivoPayload
export type UpdateActivoPayload = ActivoPayload

export interface DeleteActivoResponse {
  eliminado: boolean
  id: number
}

export type ActivoFormMode = 'create' | 'edit'
export type ActivoEstadoFiltro = 'activos' | 'inactivos' | 'todos'
