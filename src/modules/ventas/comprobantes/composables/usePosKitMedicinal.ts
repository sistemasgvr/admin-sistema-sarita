/** Roles de línea del kit medicinal inicial (oficina: ~285 = contenido + regulador + descartables + flete). */
export type KitMedicinalRol = 'contenido' | 'regulador' | 'descartable' | 'flete'

export interface KitMedicinalLinea {
  key: string
  rol: KitMedicinalRol
  idProducto: number | ''
  buscar: string
  cantidad: number
  precioUnitario: number
  codigo: string
  nombre: string
}

export const KIT_MEDICINAL_ROL_LABEL: Record<KitMedicinalRol, string> = {
  contenido: 'Cilindro / contenido',
  regulador: 'Regulador (alquiler)',
  descartable: 'Descartable (venta)',
  flete: 'Flete',
}

export function crearLineaKit(
  rol: KitMedicinalRol,
  defaults?: Partial<Pick<KitMedicinalLinea, 'cantidad' | 'precioUnitario'>>,
): KitMedicinalLinea {
  return {
    key: crypto.randomUUID(),
    rol,
    idProducto: '',
    buscar: '',
    cantidad: defaults?.cantidad ?? 1,
    precioUnitario: defaults?.precioUnitario ?? 0,
    codigo: '',
    nombre: '',
  }
}

export function crearKitMedicinalInicial(): KitMedicinalLinea[] {
  return [
    crearLineaKit('contenido'),
    crearLineaKit('regulador'),
    crearLineaKit('flete'),
  ]
}

export function importeLineaKit(linea: KitMedicinalLinea): number {
  const cant = Number(linea.cantidad) || 0
  const precio = Number(linea.precioUnitario) || 0
  return Math.round(cant * precio * 100) / 100
}

export function totalKitMedicinal(lineas: KitMedicinalLinea[]): number {
  return Math.round(lineas.reduce((acc, linea) => acc + importeLineaKit(linea), 0) * 100) / 100
}

export function lineasKitConProducto(lineas: KitMedicinalLinea[]): KitMedicinalLinea[] {
  return lineas.filter((linea) => Boolean(linea.idProducto) && Number(linea.cantidad) > 0)
}

export function addDaysIso(fechaIso: string, days: number): string {
  const base = fechaIso.includes('T') ? fechaIso.slice(0, 10) : fechaIso
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(base)
  if (!match) return base
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days))
  return date.toISOString().slice(0, 10)
}
