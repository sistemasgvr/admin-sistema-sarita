export type TipoPropietarioBalon = 'EMPRESA' | 'PLANTA' | 'CLIENTE'

export interface BalonPropietarioItem {
  id: number
  codigo_balon?: string | null
  numero_serie?: string | null
  id_propietario?: number | null
  nombre_propietario?: string | null
  id_planta?: number | null
  nombre_planta?: string | null
  id_cliente_propietario?: number | null
  nombre_cliente_propietario?: string | null
  nombre_titular?: string | null
  id_tipo_balon?: number | null
  nombre_tipo_balon?: string | null
  capacidad?: number | null
  nombre_unidad_medida?: string | null
  id_producto_gas?: number | null
  nombre_producto_gas?: string | null
  id_estado_balon?: number | null
  nombre_estado_balon?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  fecha_proxima_prueba_hidrostatica?: string | null
}

export interface BalonPropietarioPorPlanta {
  id_planta?: number | null
  nombre_planta?: string | null
  cantidad: number
}

export interface BalonPropietarioPorCliente {
  id_cliente_propietario?: number | null
  nombre_cliente_propietario?: string | null
  cantidad: number
}

export interface BalonPropietarioResumen {
  total?: number
  empresa?: number
  planta?: number
  cliente?: number
  otros?: number
  por_planta?: BalonPropietarioPorPlanta[]
  por_cliente?: BalonPropietarioPorCliente[]
}

export interface BalonPropietarioListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  tipoPropietario?: TipoPropietarioBalon | ''
  idPlanta?: number
  idClientePropietario?: number
  idAlmacen?: number
  excluirBajas?: boolean
}
