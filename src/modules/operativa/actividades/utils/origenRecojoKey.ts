import type { TipoOrigenRecojo } from '@/modules/operativa/actividades/interfaces/actividad.interface'

export function origenRecojoKey(origen: TipoOrigenRecojo, idOrigen: number) {
  return `${origen}:${idOrigen}`
}
export function numeroDesdeEtiquetaOrigen(label: string | null | undefined): string {
  if (!label) return ''
  return label.replace(/^\s*(Préstamo|Alquiler)\s+/i, '').trim()
}

export function parseOrigenRecojoKey(
  value: string | number | '',
): { tipoOrigen: TipoOrigenRecojo; idOrigen: number } | null {
  if (value === '' || value == null) return null
  const raw = String(value)
  const [tipo, id] = raw.split(':')
  if ((tipo !== 'PRESTAMO' && tipo !== 'ALQUILER') || !id) return null
  const idOrigen = Number(id)
  if (!Number.isFinite(idOrigen) || idOrigen <= 0) return null
  return { tipoOrigen: tipo, idOrigen }
}
