export type RangoAntiguedadAlquiler =
  | 'RECIENTE_0_30'
  | 'ATENCION_30_90'
  | 'SEGUIMIENTO_90_180'
  | 'CRITICO_180'
  | 'DEVUELTO'

export interface AlquilerAntiguedadResumen {
  total_pendientes?: number
  reciente_0_30?: number
  atencion_30_90?: number
  seguimiento_90_180?: number
  critico_180?: number
}

export interface AlquilerAntiguedadItem {
  id_detalle: number
  id_alquiler: number
  numero_alquiler?: string | null
  id_cliente?: number | null
  nombre_cliente?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
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
  fecha_inicio_alquiler?: string | null
  fecha_fin_pactada?: string | null
  fecha_devolucion?: string | null
  dias_en_alquiler?: number | null
  rango_antiguedad: RangoAntiguedadAlquiler
}

export interface AlquilerAntiguedadFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idCliente?: number
  rangoDias?: RangoAntiguedadAlquiler | string
  excluirBajas?: boolean
  soloPendientes?: boolean
}
