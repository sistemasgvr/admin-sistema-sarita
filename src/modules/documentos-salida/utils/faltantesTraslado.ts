import type { DocumentoSalida } from '../interfaces/documento-salida.interface'

/**
 * Mismas reglas que corre el backend antes de armar el PDF
 * (doc-salida-pdf.generator.ts): si falta algo, la API responde 400 y el
 * usuario quedaba sin saber qué. Revisar acá permite avisar con un toast
 * antes de abrir la pestaña del documento.
 */
export function faltantesTrasladoPdf(doc: DocumentoSalida | null | undefined): string[] {
  if (!doc) return []
  const faltantes: string[] = []
  if (!doc.id_tipo_guia_remision) faltantes.push('tipo de guía')
  if (!doc.id_motivo_traslado) faltantes.push('motivo')
  if (!doc.id_modalidad_traslado) faltantes.push('modalidad')
  if (!doc.fecha_traslado) faltantes.push('fecha de traslado')
  if (!(Number(doc.peso_bruto) > 0)) faltantes.push('peso bruto mayor a cero')
  if (!(Number(doc.numero_bultos) > 0) || !Number.isInteger(Number(doc.numero_bultos))) {
    faltantes.push('bultos enteros mayores a cero')
  }
  // Transporte privado (02) o guía de transportista (31): pide chofer + vehículo;
  // el resto (transporte público) pide transportista.
  if (doc.codigo_modalidad_traslado === '02' || doc.codigo_tipo_guia === '31') {
    if (!doc.id_chofer) faltantes.push('chofer')
    if (!doc.id_vehiculo) faltantes.push('vehículo')
  } else if (!doc.id_transportista) {
    faltantes.push('transportista')
  }
  return faltantes
}

export function mensajeFaltantesTraslado(faltantes: string[]): string {
  return `Completa y guarda los datos de traslado antes de generar el PDF: ${faltantes.join(', ')}.`
}
