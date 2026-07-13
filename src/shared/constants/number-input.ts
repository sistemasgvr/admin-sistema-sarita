/**
 * Pasos estándar para inputs type="number".
 * Evitar step="0.0001": la flecha del navegador sube en milésimas y parece un bug.
 */
export const NUMBER_STEP = {
  /** Piezas / unidades enteras (stock, accesorios, IDs, días). */
  unit: '1',
  /** Dinero (S/) y porcentajes. */
  money: '0.01',
  /** Medidas (m³, kg, capacidad): decimal usable sin milésimas. */
  measure: '0.01',
} as const

export const NUMBER_MIN = {
  unit: '1',
  unitZero: '0',
  money: '0',
  measure: '0',
  measurePositive: '0.01',
} as const
