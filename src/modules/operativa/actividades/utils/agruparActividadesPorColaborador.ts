import type { Actividad } from '@/modules/operativa/actividades/interfaces/actividad.interface'

export type TipoColaboradorActividad = 'Chofer' | 'Usuario' | 'Trabajador'

export interface ActividadColaboradorRanking {
  key: string
  nombre: string
  tipo: TipoColaboradorActividad
  idUsuario?: number
  idChofer?: number
  idTrabajador?: number
  cantidad: number
  ultimaFecha: string | null
  actividades: Actividad[]
}

function fechaActividad(actividad: Actividad): string {
  return actividad.fecha_hora_cierre || actividad.fecha_programada || ''
}

function fechaMasReciente(actual: string | null, candidata: string | null): string | null {
  if (!candidata) return actual
  if (!actual) return candidata
  return candidata > actual ? candidata : actual
}

export function agruparActividadesPorColaborador(
  actividades: Actividad[],
): ActividadColaboradorRanking[] {
  const grupos = new Map<string, ActividadColaboradorRanking>()

  for (const actividad of actividades) {
    let key: string
    let tipo: TipoColaboradorActividad
    let nombre: string

    let idUsuario: number | undefined
    let idChofer: number | undefined
    let idTrabajador: number | undefined

    if (actividad.id_trabajador_responsable) {
      key = `trabajador:${actividad.id_trabajador_responsable}`
      tipo = 'Trabajador'
      idTrabajador = actividad.id_trabajador_responsable
      nombre = (
        actividad.nombre_trabajador_responsable ??
        actividad.nombre_chofer_responsable ??
        actividad.nombre_usuario_responsable ??
        ''
      ).trim()
    } else if (actividad.id_chofer_responsable) {
      key = `chofer:${actividad.id_chofer_responsable}`
      tipo = 'Chofer'
      idChofer = actividad.id_chofer_responsable
      nombre = (actividad.nombre_chofer_responsable ?? '').trim()
    } else if (actividad.id_usuario_responsable) {
      key = `usuario:${actividad.id_usuario_responsable}`
      tipo = 'Usuario'
      idUsuario = actividad.id_usuario_responsable
      nombre = (actividad.nombre_usuario_responsable ?? '').trim()
    } else {
      continue
    }

    const ultimaFecha = fechaActividad(actividad) || null
    const existente = grupos.get(key)

    if (!existente) {
      grupos.set(key, {
        key,
        nombre: nombre || '—',
        tipo,
        idUsuario,
        idChofer,
        idTrabajador,
        cantidad: 1,
        ultimaFecha,
        actividades: [actividad],
      })
      continue
    }

    existente.actividades.push(actividad)
    existente.cantidad = existente.actividades.length
    existente.ultimaFecha = fechaMasReciente(existente.ultimaFecha, ultimaFecha)
    if (nombre && existente.nombre === '—') {
      existente.nombre = nombre
    }
  }

  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      actividades: [...grupo.actividades].sort((a, b) =>
        fechaActividad(b).localeCompare(fechaActividad(a)),
      ),
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
}
