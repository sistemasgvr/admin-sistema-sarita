import type { LoteProtocoloPrueba } from '@/modules/balones/lotes-protocolo/interfaces/lote-protocolo.interface'

/**
 * Valores fijos del formato de ficha que emite la planta (Anexo A del plan):
 * INDUSTRIAS CRIOGÉNICAS DEL PERÚ S.A.C. — "Protocolo de Análisis Cilindros".
 *
 * Están aquí y no en la BD porque son el encabezado impreso del documento, no
 * un catálogo del negocio: cambian cuando la planta publica otra versión del
 * formato, y entonces se edita esta constante.
 */
export const ICP_CODIGO_DOCUMENTO = 'ICP-INS-011'
export const ICP_VERSION_DOCUMENTO = '05'

/** Filas de "DATOS DE ANÁLISIS" con su especificación impresa. */
export const ICP_PRUEBAS_DEFECTO: LoteProtocoloPrueba[] = [
  {
    orden: 1,
    prueba: 'Descripción',
    especificacion: 'Gas incoloro, inodoro e insípido',
    resultado: 'Conforme',
  },
  {
    orden: 2,
    prueba: 'Identificación A',
    especificacion: 'La señal paramagnética confirma la presencia de oxígeno',
    resultado: 'Conforme',
  },
  {
    orden: 3,
    prueba: 'Identificación B',
    especificacion: 'El gas cumple los criterios de aceptación en la Valoración',
    resultado: 'Conforme',
  },
  {
    orden: 4,
    prueba: 'Valoración',
    especificacion: 'No menos de 99,5% por volumen de O2',
    resultado: '',
  },
  // El O2 producido por licuefacción del aire está exento de las pruebas de
  // impurezas: la planta imprime "N.A." en estas dos filas.
  {
    orden: 5,
    prueba: 'Límite de CO2',
    especificacion: 'No más de 300 ppm',
    resultado: 'N.A.',
  },
  {
    orden: 6,
    prueba: 'Límite de CO',
    especificacion: 'No más de 10 ppm',
    resultado: 'N.A.',
  },
]

/** Cabecera impresa que se repite en cada ficha de O2 medicinal. */
export const ICP_CABECERA_DEFECTO = {
  descripcionProducto: 'OXÍGENO MEDICINAL 99,5% V/V GAS COMPRIMIDO MEDICINAL',
  formaFarmaceutica: 'GAS COMPRIMIDO',
  normaTecnica: 'USP VIGENTE',
  metodoFabricacion: 'Licuefacción del Aire',
  conclusion: 'La muestra analizada cumple con las especificaciones arriba mencionadas.',
}

/**
 * La ficha da el vencimiento como mes/año ("08/2027"). Se guarda como el día 1
 * de ese mes para poder compararlo con CURRENT_DATE sin ambigüedad.
 */
export function mesAnioAFecha(mesAnio: string): string | undefined {
  const limpio = mesAnio.trim()
  const match = /^(\d{1,2})\s*[/-]\s*(\d{4})$/.exec(limpio)
  if (!match) return undefined
  const mes = Number(match[1])
  if (mes < 1 || mes > 12) return undefined
  return `${match[2]}-${String(mes).padStart(2, '0')}-01`
}

/** Inversa de mesAnioAFecha, para mostrar la fecha como la imprime la planta. */
export function fechaAMesAnio(fecha: string | null | undefined): string {
  if (!fecha) return ''
  const match = /^(\d{4})-(\d{2})/.exec(fecha)
  return match ? `${match[2]}/${match[1]}` : ''
}

/**
 * Series pegadas desde el PDF: vienen separadas por saltos de línea, comas,
 * punto y coma o espacios, y con duplicados.
 */
export function parsearSeriesEnvases(texto: string): string[] {
  const series = texto
    .split(/[\s,;]+/)
    .map((serie) => serie.trim().toUpperCase())
    .filter(Boolean)

  return [...new Set(series)]
}
