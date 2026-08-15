/** Fecha de negocio (YYYY-MM-DD) en zona America/Lima, no UTC del navegador. */
export function hoyIsoLima(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(date)
}

export function formatListDate(value?: string | null): string {
  if (!value) return '—'

  const date = value.slice(0, 10)
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date

  return `${day}/${month}/${year}`
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeZone: 'America/Lima',
  }).format(date)
}
