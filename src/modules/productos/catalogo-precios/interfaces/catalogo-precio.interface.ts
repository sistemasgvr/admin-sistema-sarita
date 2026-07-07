export interface CatalogoPrecio {
  id: number
  id_tipo_catalogo: number
  nombre_tipo_catalogo: string
  periodo?: string
  nombre_item: string
  id_producto?: number
  codigo_producto?: string
  nombre_producto?: string
  id_tipo_balon?: number
  nombre_tipo_balon?: string
  id_proveedor?: number
  nombre_proveedor?: string
  clasificacion?: string
  modelo?: string
  capacidad?: number
  id_unidad_medida?: number
  nombre_unidad_medida?: string
  descripcion_presentacion?: string
  costo_producto: number
  costo_flete: number
  porcentaje_margen?: number
  precio_final?: number
  precio_garantia?: number
  estado: number
  fecha_creacion: string
  fecha_modificacion: string
}

export interface CatalogoPrecioListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idTipoCatalogo?: number
  idProducto?: number
  periodo?: string
}

export interface CreateCatalogoPrecioPayload {
  idTipoCatalogo: number
  nombreItem: string
  periodo?: string
  idProducto?: number
  clasificacion?: string
  modelo?: string
  capacidad?: number
  idUnidadMedida?: number
  descripcionPresentacion?: string
  costoProducto?: number
  costoFlete?: number
  porcentajeMargen?: number
  precioFinal?: number
  precioGarantia?: number
}

export interface UpdateCatalogoPrecioPayload {
  idTipoCatalogo?: number
  nombreItem?: string
  periodo?: string
  idProducto?: number
  clasificacion?: string
  modelo?: string
  capacidad?: number
  idUnidadMedida?: number
  descripcionPresentacion?: string
  costoProducto?: number
  costoFlete?: number
  porcentajeMargen?: number
  precioFinal?: number
  precioGarantia?: number
}

export interface DeleteCatalogoPrecioResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type CatalogoPrecioFormMode = 'create' | 'edit'
