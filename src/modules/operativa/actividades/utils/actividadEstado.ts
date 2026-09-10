import type { Actividad } from '../interfaces/actividad.interface'
import { esActividadCancelada, esActividadRealizada } from './actividadTipo'

/** ¿La actividad tiene al menos un responsable asignado? */
export function estaAsignada(a?: Actividad | null): boolean {
  if (!a) return false
  return Boolean(
    a.id_trabajador_responsable ?? a.id_usuario_responsable ?? a.id_chofer_responsable,
  )
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
  trabajadorId?: number | null,
): boolean {
  if (!a) return false
  if (
    trabajadorId != null &&
    a.id_trabajador_responsable != null &&
    a.id_trabajador_responsable === trabajadorId
  ) {
    return true
  }
  if (!userId) return false
  // id_chofer_responsable es PK de chofer, no de usuario: no comparar con userId.
  return a.id_usuario_responsable === userId
}

/**
 * ¿Puede la sesión verificar esta actividad?
 * Debe estar asignada al trabajador/usuario de la sesión (el responsable).
 */
export function puedeVerificarComoResponsable(
  a: Actividad | null | undefined,
  ctx: {
    userId?: number | null
    trabajadorId?: number | null
    tienePermiso: boolean
  },
): boolean {
  if (!a || !ctx.tienePermiso || estaCerrada(a)) return false
  if (!estaAsignada(a)) return false
  return esResponsable(a, ctx.userId, ctx.trabajadorId)
}

/**
 * ¿Puede la sesión operar el flujo (iniciar/culminar entrega o recojo)?
 * Mismo chequeo de responsable de sesión + permiso de editar.
 */
export function puedeOperarComoResponsable(
  a: Actividad | null | undefined,
  ctx: {
    userId?: number | null
    trabajadorId?: number | null
    tienePermiso: boolean
  },
): boolean {
  if (!a || !ctx.tienePermiso || estaCerrada(a)) return false
  if (!estaAsignada(a)) return false
  return esResponsable(a, ctx.userId, ctx.trabajadorId)
}

/** ¿Se puede reclamar (tomar) la actividad? Solo si está sin asignar y no está cerrada. */
export function puedeTomar(
  a: Actividad | null | undefined,
  puedeEditar: boolean,
): boolean {
  return Boolean(puedeEditar) && esSinAsignar(a) && !estaCerrada(a)
}

/** ¿Se puede liberar (desasignar) o finalizar la actividad?
 * Requiere: asignada, no cerrada, (responsable o admin) y fuera de su horario.
 */
export function puedeLiberarOFinalizar(
  a: Actividad | null | undefined,
  ctx: {
    userId?: number | null
    trabajadorId?: number | null
    isAdmin: boolean
    now?: Date
  },
): boolean {
  if (!estaAsignada(a) || estaCerrada(a)) return false
  if (!ctx.isAdmin && !esResponsable(a, ctx.userId, ctx.trabajadorId)) return false
  return estaFueraDeHorario(a, ctx.now)
}
