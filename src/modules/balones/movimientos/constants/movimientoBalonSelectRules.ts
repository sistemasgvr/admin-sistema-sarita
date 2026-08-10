export type MovimientoFieldRequirement = 'required' | 'optional' | 'hidden'

export interface MovimientoBalonSelectRule {
  /** Estados de balón permitidos (código lista EstadoBalon). */
  estadosBalon: string[]
  /** Contenidos permitidos (código lista EstadoContenidoBalon). Vacío = cualquiera. */
  contenidos?: string[]
  /** Solo envases de la empresa. */
  soloEmpresa?: boolean
  cliente: MovimientoFieldRequirement
  almacenOrigen: MovimientoFieldRequirement
  almacenDestino: MovimientoFieldRequirement
  /** Si hay cliente, filtrar cilindros relacionados a él. */
  filtrarPorCliente?: boolean
  hint: string
}

const DEFAULT_RULE: MovimientoBalonSelectRule = {
  estadosBalon: [],
  cliente: 'optional',
  almacenOrigen: 'optional',
  almacenDestino: 'optional',
  hint: 'Selecciona un tipo de movimiento para filtrar los cilindros válidos.',
}

/** Reglas operativas por código TipoMovBalon. */
export const MOVIMIENTO_BALON_SELECT_RULES: Record<string, MovimientoBalonSelectRule> = {
  SALIDA_VENTA: {
    estadosBalon: ['EN_ALMACEN'],
    contenidos: ['LLENO'],
    soloEmpresa: true,
    cliente: 'optional',
    almacenOrigen: 'required',
    almacenDestino: 'hidden',
    hint: 'Solo cilindros de la empresa, llenos y en almacén.',
  },
  SALIDA_PRESTAMO: {
    estadosBalon: ['EN_ALMACEN'],
    soloEmpresa: true,
    cliente: 'required',
    almacenOrigen: 'required',
    almacenDestino: 'hidden',
    hint: 'Cilindros de la empresa en almacén listos para prestar.',
  },
  SALIDA_ALQUILER: {
    estadosBalon: ['EN_ALMACEN'],
    soloEmpresa: true,
    cliente: 'required',
    almacenOrigen: 'required',
    almacenDestino: 'hidden',
    hint: 'Cilindros de la empresa en almacén (legado alquiler).',
  },
  SALIDA_MANTENIMIENTO: {
    estadosBalon: ['EN_ALMACEN'],
    soloEmpresa: true,
    cliente: 'hidden',
    almacenOrigen: 'required',
    almacenDestino: 'optional',
    hint: 'Cilindros en almacén para enviar a mantenimiento.',
  },
  SALIDA_PLANTA_EXTERNA: {
    estadosBalon: ['EN_ALMACEN', 'EN_RECARGA_EXTERNA'],
    contenidos: ['VACIO', 'LLENO'],
    soloEmpresa: true,
    cliente: 'hidden',
    almacenOrigen: 'required',
    almacenDestino: 'hidden',
    hint: 'Cilindros EMPRESA enviados a planta externa para recarga.',
  },
  SALIDA_ENTREGA_CLIENTE: {
    estadosBalon: ['EN_MANTENIMIENTO', 'EN_ALMACEN'],
    cliente: 'required',
    almacenOrigen: 'optional',
    almacenDestino: 'hidden',
    filtrarPorCliente: true,
    hint: 'Cilindros listos para entregar al cliente tras el servicio.',
  },
  ENTRADA_DEVOLUCION: {
    estadosBalon: ['PRESTADO_CLIENTE', 'ALQUILADO', 'POR_RECOGER', 'EN_PODER_CLIENTE'],
    cliente: 'optional',
    almacenOrigen: 'hidden',
    almacenDestino: 'required',
    filtrarPorCliente: true,
    hint: 'Cilindros fuera de almacén (prestados o en poder del cliente).',
  },
  ENTRADA_MANTENIMIENTO: {
    estadosBalon: ['EN_MANTENIMIENTO', 'PRESTADO_CLIENTE', 'POR_RECOGER'],
    cliente: 'optional',
    almacenOrigen: 'optional',
    almacenDestino: 'required',
    hint: 'Cilindros que regresan o están en mantenimiento.',
  },
  ENTRADA_LLENADO: {
    estadosBalon: ['EN_RUTA_LIMA', 'EN_ALMACEN'],
    contenidos: ['LLENO', 'VACIO'],
    soloEmpresa: true,
    cliente: 'hidden',
    almacenOrigen: 'optional',
    almacenDestino: 'required',
    hint: 'Cilindros que ingresan desde planta de llenado.',
  },
  ENTRADA_PLANTA_EXTERNA: {
    estadosBalon: ['EN_RECARGA_EXTERNA', 'EN_ALMACEN'],
    contenidos: ['LLENO', 'VACIO'],
    soloEmpresa: true,
    cliente: 'hidden',
    almacenOrigen: 'hidden',
    almacenDestino: 'required',
    hint: 'Cilindros que retornan llenos desde planta externa.',
  },
  RECARGA_CLIENTE: {
    estadosBalon: ['EN_ALMACEN', 'EN_PODER_CLIENTE', 'PRESTADO_CLIENTE'],
    cliente: 'required',
    almacenOrigen: 'optional',
    almacenDestino: 'optional',
    filtrarPorCliente: true,
    hint: 'Cilindros del cliente (propios o en custodia) para recarga.',
  },
  TRASLADO_LIMA: {
    estadosBalon: ['EN_ALMACEN'],
    soloEmpresa: true,
    cliente: 'hidden',
    almacenOrigen: 'required',
    almacenDestino: 'optional',
    hint: 'Cilindros en almacén para traslado a Lima.',
  },
  RETORNO_LIMA: {
    estadosBalon: ['EN_RUTA_LIMA'],
    soloEmpresa: true,
    cliente: 'hidden',
    almacenOrigen: 'optional',
    almacenDestino: 'required',
    hint: 'Cilindros en ruta / Lima para retorno a almacén.',
  },
}

export function getMovimientoBalonSelectRule(
  tipoCodigo?: string | null,
): MovimientoBalonSelectRule {
  if (!tipoCodigo) return DEFAULT_RULE
  return MOVIMIENTO_BALON_SELECT_RULES[tipoCodigo.trim().toUpperCase()] ?? {
    ...DEFAULT_RULE,
    hint: 'Tipo sin regla específica: se listan cilindros activos (sin baja).',
  }
}
