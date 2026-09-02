export interface Producto {
  id: number
  codigo: string
  codigo_barra?: string
  codigo_ubicacion?: string | null
  nombre: string
  id_sub_categoria?: number
  nombre_sub_categoria?: string
  id_categoria?: number
  nombre_categoria?: string
  id_unidad_medida?: number
  nombre_unidad_medida?: string
  marca?: string
  presentacion?: string
  es_gas: boolean
  es_servicio: boolean
  es_alquilable: boolean
  /** Taller de cilindro (P.H., válvula). Distinto de flete u otros servicios. */
  es_mantenimiento?: boolean | null
  afecta_stock: boolean
  precio: number
  precio_compra?: number | null
  precio_garantia?: number | null
  factor_kg_m3?: number | null
  factor_lb_m3?: number | null
  /** True si tiene stock <> 0 en algún almacén (bloquea eliminación). */
  tiene_stock?: boolean | null
  stock_actual?: number | null
  stock_minimo?: number | null
  stock_bajo?: boolean | null
  /** URL firmada de la imagen principal (si existe). */
  url_imagen_principal?: string | null
  estado: number
  fecha_creacion: string
  fecha_modificacion: string
}

export interface ProductoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idSubCategoria?: number
  idCategoria?: number
  esGas?: boolean
  esServicio?: boolean
  esAlquilable?: boolean
  esMantenimiento?: boolean
  afectaStock?: boolean
  soloActivos?: number | null
  idAlmacen?: number
  /** true = firmar URLs de imagen (listados con miniatura). Default: false */
  incluirImagenes?: boolean
}

export interface CreateProductoPayload {
  codigo: string
  nombre: string
  idSubCategoria?: number
  codigoBarra?: string
  codigoUbicacion?: string
  idUnidadMedida?: number
  marca?: string
  presentacion?: string
  esGas?: boolean
  esServicio?: boolean
  esAlquilable?: boolean
  esMantenimiento?: boolean
  afectaStock?: boolean
  precio?: number
  precioCompra?: number
  precioGarantia?: number
  factorKgM3?: number
  factorLbM3?: number
}

export interface UpdateProductoPayload {
  codigo?: string
  nombre?: string
  idSubCategoria?: number
  codigoBarra?: string
  codigoUbicacion?: string
  idUnidadMedida?: number
  marca?: string
  presentacion?: string
  esGas?: boolean
  esServicio?: boolean
  esAlquilable?: boolean
  esMantenimiento?: boolean
  afectaStock?: boolean
  precio?: number
  precioCompra?: number
  precioGarantia?: number
  factorKgM3?: number
  factorLbM3?: number
  /**
   * Confirma la conversión del saldo al cambiar `idUnidadMedida`.
   *
   * `pro_stock` no guarda unidad propia: el saldo se lee en la unidad actual del
   * producto, así que cambiarla lo reinterpretaría. La API rechaza el cambio si el
   * producto tiene stock o movimientos y devuelve `requiere_confirmacion: true`;
   * reenviar con este flag convierte el saldo dejando un movimiento de AJUSTE.
   */
  convertirStock?: boolean
}

export interface DeleteProductoResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type ProductoFormMode = 'create' | 'edit'
export type ProductoEstadoFiltro = 'activos' | 'inactivos' | 'todos'
