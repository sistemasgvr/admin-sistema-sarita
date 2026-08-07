export type EstadoRecojoNombre =
  | 'PROGRAMADO'
  | 'EN_RUTA'
  | 'EXITOSO'
  | 'FALLIDO'
  | 'REPROGRAMADO'
  | 'CANCELADO'

export type ResultadoRecojoNombre = 'RECOGIDO' | 'NO_RECOGIDO' | 'EXTENDIDO'

export type MotivoFalloRecojoNombre =
  | 'CLIENTE_AUSENTE'
  | 'SIN_ACCESO'
  | 'CILINDRO_NO_DISPONIBLE'
  | 'GAS_NO_USADO'
  | 'OTRO'

export interface RecojoDetalle {
  id: number
  id_recojo: number
  id_prestamo_detalle?: number | null
  id_alquiler_detalle?: number | null
  origen?: 'PRESTAMO' | 'ALQUILER' | string | null
  id_origen?: number | null
  numero_origen?: string | null
  id_prestamo?: number | null
  numero_prestamo?: string | null
  id_alquiler?: number | null
  numero_alquiler?: string | null
  id_balon?: number | null
  codigo_balon?: string | null
  id_producto_gas?: number | null
  nombre_producto_gas?: string | null
  capacidad?: number | string | null
  nombre_unidad_medida?: string | null
  descripcion_unidad_medida?: string | null
  fecha_vencimiento?: string | null
  fecha_devolucion?: string | null
  id_resultado?: number | null
  nombre_resultado?: string | null
  id_estado_contenido?: number | null
  nombre_estado_contenido?: string | null
  cantidad_restante?: number | string | null
  nueva_fecha_retorno?: string | null
  id_almacen_destino?: number | null
  nombre_almacen_destino?: string | null
  observacion?: string | null
  estado: number
}

export interface Recojo {
  id: number
  id_cliente: number
  nombre_cliente?: string | null
  documento_cliente?: string | null
  latitud?: number | string | null
  longitud?: number | string | null
  direccion?: string | null
  id_prestamo?: number | null
  numero_prestamo?: string | null
  id_alquiler?: number | null
  numero_alquiler?: string | null
  tipo_origen?: 'PRESTAMO' | 'ALQUILER' | 'MIXTO'
  fecha_programada: string
  hora_estimada?: string | null
  fecha_visita?: string | null
  id_usuario_responsable?: number | null
  nombre_usuario_responsable?: string | null
  id_estado?: number | null
  nombre_estado?: string | null
  id_motivo_fallo?: number | null
  nombre_motivo_fallo?: string | null
  observacion?: string | null
  total_detalles?: number | null
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string | null
  detalles?: RecojoDetalle[]
}

export interface RecojoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idCliente?: number
  idPrestamo?: number
  idAlquiler?: number
  estadoNombre?: string
  fechaDesde?: string
  fechaHasta?: string
}

export interface CreateRecojoDetallePayload {
  idPrestamoDetalle?: number
  idAlquilerDetalle?: number
  observacion?: string
}

export interface CreateRecojoPayload {
  idUsuarioAuditoria: number
  idCliente: number
  idPrestamo?: number
  idAlquiler?: number
  fechaProgramada: string
  horaEstimada?: string
  idUsuarioResponsable?: number
  observacion?: string
  detalles: CreateRecojoDetallePayload[]
}

export interface UpdateRecojoPayload {
  idUsuarioAuditoria: number
  idPrestamo?: number
  idAlquiler?: number
  fechaProgramada?: string
  horaEstimada?: string
  idUsuarioResponsable?: number
  estadoNombre?: 'PROGRAMADO' | 'EN_RUTA' | 'CANCELADO'
  observacion?: string
}

export interface RegistrarResultadoDetallePayload {
  idPrestamoDetalle?: number
  idAlquilerDetalle?: number
  resultado: ResultadoRecojoNombre
  nombreEstadoContenido?: string
  cantidadRestante?: number
  nuevaFechaRetorno?: string
  idAlmacenDestino?: number
  observacion?: string
}

export interface PendienteRecojo {
  origen: 'PRESTAMO' | 'ALQUILER'
  id_origen: number
  numero_origen: string
  id_detalle: number
  id_cliente: number
  nombre_cliente?: string | null
  id_balon?: number | null
  codigo_balon?: string | null
  fecha_retorno?: string | null
  dias_pendientes?: number | null
  tiene_recojo_programado: boolean
}

export interface PendienteRecojoFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idCliente?: number
  tipoOrigen?: 'PRESTAMO' | 'ALQUILER'
  fechaHasta?: string
}

export interface RegistrarResultadoRecojoPayload {
  idUsuarioAuditoria: number
  fechaVisita?: string
  idMotivoFallo?: number
  motivoFalloNombre?: MotivoFalloRecojoNombre | string
  observacion?: string
  detalles: RegistrarResultadoDetallePayload[]
}

export interface DeleteRecojoResponse {
  eliminado: boolean
  id: number
  error?: string
}

export const ESTADOS_RECOJO_FILTRO: { value: EstadoRecojoNombre; label: string }[] = [
  { value: 'PROGRAMADO', label: 'Programado' },
  { value: 'EN_RUTA', label: 'En ruta' },
  { value: 'EXITOSO', label: 'Exitoso' },
  { value: 'FALLIDO', label: 'Fallido' },
  { value: 'REPROGRAMADO', label: 'Reprogramado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

export const MOTIVOS_FALLO_RECOJO: { value: MotivoFalloRecojoNombre; label: string }[] = [
  { value: 'CLIENTE_AUSENTE', label: 'Cliente ausente' },
  { value: 'SIN_ACCESO', label: 'Sin acceso' },
  { value: 'CILINDRO_NO_DISPONIBLE', label: 'Cilindro no disponible' },
  { value: 'GAS_NO_USADO', label: 'Gas no usado / pide más tiempo' },
  { value: 'OTRO', label: 'Otro' },
]

export const RESULTADOS_RECOJO: { value: ResultadoRecojoNombre; label: string }[] = [
  { value: 'RECOGIDO', label: 'Recogido' },
  { value: 'NO_RECOGIDO', label: 'No recogido' },
  { value: 'EXTENDIDO', label: 'Extendido (+ fecha)' },
]
