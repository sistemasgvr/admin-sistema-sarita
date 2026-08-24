import type { Actividad } from './actividad.interface'
import { esActividadCancelada, esActividadRealizada } from './actividadTipo'

/** ¿La actividad tiene al menos un responsable asignado? */
export function estaAsignada(a?: Actividad | null): boolean {
  if (!a) return false
  return Boolean(a.id_usuario_responsable ?? a.id_chofer_responsable)
}

/** ¿Sin responsable asignado (para mostrar "Sin asignar")? */
export function esSinAsignar(a?: Actividad | null): boolean {
  return !estaAsignada(a)
}

export function estaCerrada(a?: Actividad | null): boolean {
  return (
    esActividadRealizada(a?.nombre_estado_actividad) ||
    esActividadCancelada(a?.nombre_estado_actividad)
  )
}

/** ¿Ya pasó el horario programado (hora de fin estimada)? */
export function estaFueraDeHorario(a?: Actividad | null, now: Date = new Date()): boolean {
  if (!a?.fecha_programada) return false
  const fecha = a.fecha_programada.slice(0, 10)
  const hora = (a.hora_fin_estimada ?? '23:59:59').slice(0, 8)
  const fin = new Date(`${fecha}T${hora}`)
  if (Number.isNaN(fin.getTime())) return false
  return now.getTime() > fin.getTime()
}

/** En curso = asignada y aún no cerrada (independiente de si pasó el horario). */
export function esEnCurso(a?: Actividad | null): boolean {
  return estaAsignada(a) && !estaCerrada(a)
}

export function esResponsable(
  a: Actividad | null | undefined,
  userId?: number | null,
): boolean {
  if (!a || !userId) return false
  return a.id_usuario_responsable === userId || a.id_chofer_responsable === userId
}

/** ¿Se puede reclamar (tomar) la actividad? Solo si está sin asignar y no está cerrada. */
export function puedeTomar(
  a: Actividad | null | undefined,
  puedeEditar: boolean,
): boolean {
  return Boolean(puedeEditar) && esSinAsignar(a) && !estaCerrada(a)
}

/**
 * ¿Se puede liberar (desasignar) o finalizar la actividad?
 * Requiere: asignada, no cerrada, (responsable o admin) y fuera de su horario.
 */
export function puedeLiberarOFinalizar(
  a: Actividad | null | undefined,
  ctx: { userId?: number | null; isAdmin: boolean; now?: Date },
): boolean {
  if (!estaAsignada(a) || estaCerrada(a)) return false
  if (!ctx.isAdmin && !esResponsable(a, ctx.userId)) return false
  return estaFueraDeHorario(a, ctx.now)
}
