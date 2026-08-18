export function horaAMinutos(value?: string | null): number | null {
  if (!value) return null
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function horaFinEsPosterior(
  inicio?: string | null,
  fin?: string | null,
): boolean {
  const desde = horaAMinutos(inicio)
  const hasta = horaAMinutos(fin)
  if (desde == null || hasta == null) return true
  return hasta > desde
}
