import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'

/** Glosa al estilo oficina / GRE SUNAT: "{Gas} Estándar GAS ENVASE {código} CAP {n} {und}". */
export function buildGuiaDetalleGlosa(
  balon: Pick<
    Balon,
    | 'codigo_balon'
    | 'numero_serie'
    | 'nombre_producto_gas'
    | 'nombre_tipo_balon'
    | 'capacidad'
    | 'nombre_unidad_medida'
  >,
): string {
  const gas = (balon.nombre_producto_gas || balon.nombre_tipo_balon || 'GAS').trim()
  const codigo = (balon.codigo_balon || balon.numero_serie || '').trim()
  const parts = [`${gas} Estándar GAS ENVASE`]
  if (codigo) parts.push(codigo)

  if (balon.capacidad != null && Number(balon.capacidad) > 0) {
    const und = (balon.nombre_unidad_medida || '').trim()
    parts.push(`CAP ${balon.capacidad}${und ? ` ${und}` : ''}`)
  }

  return parts.join(' ').slice(0, 255)
}

export function labelBalonGuia(balon: Pick<Balon, 'codigo_balon' | 'nombre_producto_gas' | 'nombre_tipo_balon' | 'capacidad' | 'nombre_unidad_medida'>): string {
  const gas = balon.nombre_producto_gas || balon.nombre_tipo_balon || 'GAS'
  const cap =
    balon.capacidad != null
      ? ` · ${balon.capacidad}${balon.nombre_unidad_medida ? ` ${balon.nombre_unidad_medida}` : ''}`
      : ''
  return `${balon.codigo_balon} · ${gas}${cap}`
}
