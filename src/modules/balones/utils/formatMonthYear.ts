const MONTH_LABELS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

export const MES_FABRICACION_OPTIONS = MONTH_LABELS.map((label, index) => ({
  label: label.charAt(0).toUpperCase() + label.slice(1),
  value: index + 1,
}))

/** Formato de negocio pH: solo mes/año (ej. "marzo 2021"). */
export function formatMonthYear(
  value?: string | Date | null,
  mes?: number | null,
  anio?: number | null,
): string {
  if (mes != null && anio != null && mes >= 1 && mes <= 12) {
    return `${MONTH_LABELS[mes - 1]} ${anio}`
  }

  if (!value) return '—'

  const raw = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10)
  const [y, m] = raw.split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) return '—'

  return `${MONTH_LABELS[m - 1]} ${y}`
}

export function toFirstOfMonthIso(mes?: number | null, anio?: number | null): string | undefined {
  if (mes == null || anio == null || mes < 1 || mes > 12) return undefined
  return `${anio}-${String(mes).padStart(2, '0')}-01`
}

export function addYearsMonthYear(
  mes?: number | null,
  anio?: number | null,
  years = 5,
): { mes: number; anio: number } | null {
  if (mes == null || anio == null || mes < 1 || mes > 12) return null
  return { mes, anio: anio + years }
}
