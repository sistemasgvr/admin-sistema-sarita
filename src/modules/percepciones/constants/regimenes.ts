/**
 * Tasas SUNAT por código de régimen de percepción (catálogo 22).
 * La tasa está fija por SUNAT según el régimen.
 * Extraído de la seed: 01→2%, 02→1%, 03→0.5%
 */
export const TASAS_PERCEPCION: Record<string, number> = {
  '01': 2,
  '02': 1,
  '03': 0.5,
}

/**
 * Tasas SUNAT por código de régimen de retención (catálogo 23).
 * Extraído de la seed: 01→3%, 02→6%
 */
export const TASAS_RETENCION: Record<string, number> = {
  '01': 3,
  '02': 6,
}
