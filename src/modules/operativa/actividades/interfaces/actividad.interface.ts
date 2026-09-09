export interface ActividadItem {
  id?: number
  item?: number
  id_producto?: number | null
  nombre_producto?: string | null
  descripcion?: string | null
  cantidad: number
  nombre_unidad_medida?: string | null
  id_balon?: number | null
  codigo_balon?: string | null
  numero_serie_balon?: string | null
  nombre_tipo_balon?: string | null
  nombre_producto_gas?: string | null
  /** Estado de verificación por momento (Fase 6). */
  id_estado_verificacion_salida?: number | null
  estado_verificacion_salida?: string | null
  observacion_salida?: string | null
  id_estado_verificacion_llegada?: number | null
  estado_verificacion_llegada?: string | null
  observacion_llegada?: string | null
  id_estado_producto_recogido?: number | null
  estado_producto_recogido?: string | null
  /** Detalle de origen: la entrega se carga por FK, no se re-teclea. */
  id_doc_salida_detalle?: number | null
  id_venta_detalle?: number | null
  id_prestamo_detalle?: number | null
  id_alquiler_detalle?: number | null
}

export type TipoOrigenRecojo = 'PRESTAMO' | 'ALQUILER'

export interface DetalleOrigenCilindro {
  id: number
  id_balon?: number | null
  codigo_balon?: string | null
  numero_serie_balon?: string | null
  nombre_tipo_balon?: string | null
  id_producto?: number | null
  nombre_producto?: string | null
  nombre_producto_gas?: string | null
  cantidad?: number | null
}

export interface DetalleOrigenGarantia {
  id: number
  monto_saldo?: number | null
  monto_cobrado?: number | null
  monto_devuelto?: number | null
  nombre_estado?: string | null
  nombre_producto?: string | null
}

export interface DetalleOrigenActividad {
  origen: TipoOrigenRecojo
  id_origen: number
  numero?: string | null
  fecha_pactada?: string | null
  cilindros?: DetalleOrigenCilindro[]
  garantias?: DetalleOrigenGarantia[]
  regulador?: {
    id_producto?: number | null
    nombre_producto?: string | null
    codigo_producto?: string | null
    pendiente?: boolean
  } | null
}

export interface OrigenVencidoRecojo {
  origen: TipoOrigenRecojo
  id_origen: number
  numero: string
  id_cliente?: number | null
  nombre_cliente?: string | null
  fecha_pactada?: string | null
  dias_vencido: number
  cilindros_pendientes?: number | null
  garantias_activas?: number | null
  regulador_pendiente?: boolean | null
}

export interface Actividad {
  id: number
  titulo: string
  descripcion?: string | null
  fecha_programada: string
  hora_inicio_estimada: string
  hora_fin_estimada: string
  fecha_hora_cierre?: string | null
  id_tipo_actividad: number
  nombre_tipo_actividad?: string | null
  id_prioridad: number
  nombre_prioridad?: string | null
  id_cliente?: number | null
  razon_social_cliente?: string | null
  latitud_cliente?: number | null
  longitud_cliente?: number | null
  id_usuario_responsable?: number | null
  nombre_usuario_responsable?: string | null
  id_chofer_responsable?: number | null
  nombre_chofer_responsable?: string | null
  id_trabajador_responsable?: number | null
  nombre_trabajador_responsable?: string | null
  id_comprobante?: number | null
  serie_comprobante?: string | null
  numero_comprobante?: string | null
  id_doc_salida?: number | null
  serie_doc_salida?: string | null
  numero_sunat_doc_salida?: string | null
  numero_doc_salida?: string | null
  id_prestamo?: number | null
  numero_prestamo?: string | null
  fecha_retorno_pactada_prestamo?: string | null
  id_alquiler?: number | null
  numero_alquiler?: string | null
  fecha_fin_pactada_alquiler?: string | null
  id_tipo_origen?: number | null
  nombre_tipo_origen?: string | null
  id_estado_actividad: number
  nombre_estado_actividad?: string | null
  observaciones?: string | null
  estado?: number
  fecha_creacion: string
  fecha_modificacion: string
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  items?: ActividadItem[]
  /** Detalle en vivo del préstamo/alquiler mientras no hay ítems materializados. */
  detalle_origen?: DetalleOrigenActividad | null
  en_curso?: boolean
}

/** Filtros soportados por GET /operativa/actividades */
export interface ActividadListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  fechaDesde?: string
  fechaHasta?: string
  idEstado?: number
  idTipo?: number
  idPrioridad?: number
  sinResponsable?: boolean
}

export interface ActividadItemPayload {
  item?: number
  idProducto?: number
  descripcion?: string
  cantidad?: number
  idBalon?: number
}

/** Body compartido por POST y PATCH /operativa/actividades */
export interface ActividadPayload {
  idUsuarioAuditoria: number
  titulo: string
  descripcion?: string
  fechaProgramada: string
  horaInicioEstimada: string
  horaFinEstimada: string
  fechaHoraCierre?: string
  idTipoActividad: number
  idPrioridad: number
  idCliente?: number
  idTrabajadorResponsable?: number
  idComprobante?: number
  idDocSalida?: number
  items?: ActividadItemPayload[]
  idEstadoActividad: number
  observaciones?: string
}

export type CreateActividadPayload = ActividadPayload
export type UpdateActividadPayload = ActividadPayload

export interface DeleteActividadResponse {
  eliminado: boolean
  id: number
}

export type ActividadFormMode = 'create' | 'edit'

/** Prefill al crear un reparto desde una orden de salida. */
export interface ActividadRepartoPrefill {
  titulo?: string | null
  clienteId?: number | null
  clienteLabel?: string | null
  idComprobante?: number | null
  idDocSalida?: number | null
  docSalidaLabel?: string | null
  choferId?: number | null
  choferLabel?: string | null
  descripcion?: string | null
  items?: ActividadItem[]
}

/** Fase 6: verificación por escaneo, recojos y ranking. */
export type MomentoVerificacion = 'SALIDA' | 'LLEGADA'

export interface VerificarActividadPayload {
  momento: MomentoVerificacion
  codigos: string[]
  observacion?: string
  idUsuarioAuditoria?: number
}

export interface VerificarActividadResult {
  momento: MomentoVerificacion
  coincidencias: number
  noPertenecen: number
  pendientes: number
  completo: boolean
}

export interface CrearRecojoOrigenPayload {
  tipoOrigen: TipoOrigenRecojo
  idOrigen: number
  fechaProgramada?: string
  idTrabajadorResponsable?: number
  observaciones?: string
  idUsuarioAuditoria?: number
}

export interface CrearRecojoPrestamoPayload {
  idPrestamo: number
  fechaProgramada?: string
  idTrabajadorResponsable?: number
  observaciones?: string
  idUsuarioAuditoria?: number
}

export interface CrearRecojoResult {
  id: number
  creada: boolean
  items: number
}

export interface OrigenVencidoRecojoFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface GenerarRecojosPayload {
  diasAntes?: number
  idTrabajadorResponsable?: number
  idUsuarioAuditoria?: number
}

export interface GenerarRecojosResult {
  diasAntes: number
  creadas: number
  yaExistian: number
  idActividades: number[]
}

export interface RankingActividadFila {
  id_responsable: number | null
  nombre: string
  total: number
  realizadas: number
  pendientes: number
  canceladas: number
  repartos: number
  recojos: number
}

export interface RankingActividadesFilters {
  fechaDesde?: string
  fechaHasta?: string
  limite?: number
}
