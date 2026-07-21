export interface ProductoImagen {
  id: number
  id_producto: number
  codigo_producto?: string
  nombre_producto?: string
  id_archivo: number
  nombre_original?: string
  nombre_almacenado?: string
  ruta: string
  bucket: string
  mime_type?: string | null
  extension?: string | null
  tamanio_bytes?: number | null
  orden: number
  es_principal: boolean
  estado: number
  url_firmada?: string
  expires_in?: number
  fecha_creacion?: string
  fecha_modificacion?: string
}

export interface ProductoImagenListFilters {
  pagina?: number
  limite?: number
}

export interface CreateProductoImagenMeta {
  orden?: number
  esPrincipal?: boolean
  idUsuarioAuditoria?: number
}

export interface UpdateProductoImagenPayload {
  orden?: number
  esPrincipal?: boolean
  idUsuarioAuditoria?: number
}

export interface DeleteProductoImagenResponse {
  eliminado: boolean
  id: number
  id_producto?: number
  id_archivo?: number
  ruta?: string
  bucket?: string
}
