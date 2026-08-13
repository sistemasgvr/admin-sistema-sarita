export function esTipoRepartoNombre(nombre?: string | null) {
  return (nombre ?? '').trim().toUpperCase() === 'REPARTO'
}

export function idOpcionPorNombre(
  opciones: Array<{ id: number; nombre: string }> | undefined,
  candidatos: string[],
) {
  const wanted = new Set(candidatos.map((n) => n.trim().toUpperCase()))
  return opciones?.find((o) => wanted.has((o.nombre ?? '').trim().toUpperCase()))?.id
}

export function esActividadRealizada(nombreEstado?: string | null) {
  return (nombreEstado ?? '').trim().toUpperCase() === 'REALIZADA'
}

export function esActividadCancelada(nombreEstado?: string | null) {
  const n = (nombreEstado ?? '').trim().toUpperCase()
  return n === 'CANCELADA' || n === 'CANCELADO'
}

export function tieneActividadVigente(row?: {
  tiene_actividad?: boolean | null
  id_actividad?: number | null
  nombre_estado_actividad?: string | null
} | null) {
  if (!row) return false
  if (esActividadCancelada(row.nombre_estado_actividad)) return false
  return Boolean(row.tiene_actividad || row.id_actividad)
}

export function nombreChoferCompleto(chofer: {
  nombres?: string | null
  apellido_paterno?: string | null
  apellido_materno?: string | null
}) {
  return [chofer.nombres, chofer.apellido_paterno, chofer.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
}
