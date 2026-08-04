export const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseYMD(ymd: string): Date | null {
  const match = YMD_RE.exec(ymd)
  if (!match) return null
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return Number.isNaN(date.getTime()) ? null : date
}

export function displayDDMMYYYY(ymd: string): string {
  const match = YMD_RE.exec(ymd)
  if (!match) return ''
  const [, y, m, d] = match
  return `${d}/${m}/${y}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/** Compara solo la parte de día (ignora la hora): -1, 0 o 1. */
export function compareDay(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return da === db ? 0 : da < db ? -1 : 1
}

/** Convierte el prop `min`/`max` (string YMD o timestamp) a Date. */
export function parseBoundary(value: number | string | undefined): Date | null {
  if (value === undefined || value === '') return null
  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const ymd = parseYMD(value)
  if (ymd) return ymd
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Cuadrícula del mes (semana de lunes a domingo) rellenada con `null` para los huecos. */
export function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)
  return days
}
