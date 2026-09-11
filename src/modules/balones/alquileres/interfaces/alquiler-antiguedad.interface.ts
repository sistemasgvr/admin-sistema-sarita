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

/** Una fila por alquiler: el alquiler es solo del regulador/accesorio. */
export interface AlquilerAntiguedadItem {
  id_alquiler: number
  numero_alquiler?: string | null
  id_cliente?: number | null
  nombre_cliente?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  id_producto?: number | null
  nombre_producto?: string | null
  codigo_producto?: string | null
  nombre_estado?: string | null
  dias_periodo?: number | null
  tarifa_diaria?: number | null
  fecha_inicio_alquiler?: string | null
  fecha_fin_pactada?: string | null
  fecha_devolucion?: string | null
  nombre_condicion_regulador?: string | null
  dias_en_alquiler?: number | null
  dias_atraso?: number | null
  rango_antiguedad: RangoAntiguedadAlquiler
}

export interface AlquilerAntiguedadFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idCliente?: number
  rangoDias?: RangoAntiguedadAlquiler | string
  soloPendientes?: boolean
}
