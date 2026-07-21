export type RangoAntiguedadPrestamo =
  | 'RECIENTE_0_30'
  | 'ATENCION_30_90'
  | 'SEGUIMIENTO_90_180'
  | 'CRITICO_180'
  | 'DEVUELTO'

export interface PrestamoAntiguedadResumen {
  total_pendientes?: number
  reciente_0_30?: number
  atencion_30_90?: number
  seguimiento_90_180?: number
  critico_180?: number
}

export interface PrestamoAntiguedadItem {
  id_detalle: number
  id_prestamo: number
  numero_prestamo?: string | null
  id_cliente?: number | null
  nombre_cliente?: string | null
  id_proveedor?: number | null
  nombre_proveedor?: string | null
  id_balon?: number | null
  codigo_balon?: string | null
  numero_serie?: string | null
  nombre_tipo_balon?: string | null
  capacidad?: number | null
  nombre_unidad_medida?: string | null
  nombre_producto_gas?: string | null
  nombre_marca_cilindro?: string | null
  nombre_organo_inspector?: string | null
  organo_inspector_no_aplica?: boolean
  nombre_planta?: string | null
  fecha_proxima_prueba_hidrostatica?: string | null
  mes_fabricacion?: number | null
  anio_fabricacion?: number | null
  nombre_estado_balon?: string | null
  fecha_inicio_prestamo?: string | null
  fecha_devolucion?: string | null
  fecha_vencimiento?: string | null
  dias_prestamo?: number | null
  dias_en_prestamo?: number | null
  rango_antiguedad: RangoAntiguedadPrestamo
}

export interface PrestamoAntiguedadFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idCliente?: number
  rangoDias?: RangoAntiguedadPrestamo | string
  excluirBajas?: boolean
  soloPendientes?: boolean
}
