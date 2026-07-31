/** Formatea un único segmento dd/mm/yyyy a partir de sus dígitos crudos. */
function formatSingleSegment(digits: string): string {
  const d = digits.slice(0, 2)
  const m = digits.slice(2, 4)
  const y = digits.slice(4, 8)
  let out = d
  if (m) out += '/' + m
  if (y) out += '/' + y
  return out
}

/** Da formato "dd/mm/yyyy — dd/mm/yyyy" al texto tipeado, conservando el separador ya escrito. */
export function formatRangeInputMasked(raw: string): string {
  const sepIdx = raw.indexOf('—')
  const leftRaw = sepIdx >= 0 ? raw.slice(0, sepIdx) : raw
  const rightRaw = sepIdx >= 0 ? raw.slice(sepIdx + 1) : null

  const leftDigits = leftRaw.replace(/\D/g, '').slice(0, 8)
  const leftFormatted = formatSingleSegment(leftDigits)

  if (rightRaw === null) {
    if (leftDigits.length === 8) return `${leftFormatted} — `
    return leftFormatted
  }

  const rightDigits = rightRaw.replace(/\D/g, '').slice(0, 8)
  const rightFormatted = formatSingleSegment(rightDigits)
  return `${leftFormatted} — ${rightFormatted}`
}

/** Cuenta cuántos dígitos preceden a la posición del cursor en el texto crudo. */
export function rangeInputDigitIndexAtCursor(raw: string, cursorPos: number): number {
  let count = 0
  for (let i = 0; i < Math.min(cursorPos, raw.length); i++) {
    if (/\d/.test(raw[i])) count++
  }
  return count
}

/** Ubica el cursor en el texto ya formateado, en la posición justo después del dígito `digitIdx`. */
export function cursorPositionForRangeFormatted(
  formatted: string,
  digitIdx: number,
  cursorAfterSep: boolean,
): number {
  const sepIdx = formatted.indexOf('—')

  if (digitIdx <= 0) {
    return cursorAfterSep && sepIdx >= 0 ? sepIdx + 2 : 0
  }

  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (!/\d/.test(formatted[i])) continue
    seen++
    if (seen !== digitIdx) continue

    const isLastDigitOfLeftSegment =
      sepIdx >= 0 && i < sepIdx && !/\d/.test(formatted.slice(i + 1, sepIdx))
    if (isLastDigitOfLeftSegment && cursorAfterSep) {
      return sepIdx + 2
    }
    return i + 1
  }

  return formatted.length
}

/** Límites del separador " — " dentro del texto crudo (para saber si el cursor ya lo pasó). */
export function getEmDashSepBounds(raw: string): { sepStart: number; sepEnd: number } | null {
  const idx = raw.indexOf('—')
  if (idx < 0) return null
  let sepEnd = idx + 1
  if (raw[sepEnd] === ' ') sepEnd++
  let sepStart = idx
  if (raw[sepStart - 1] === ' ') sepStart--
  return { sepStart, sepEnd }
}

export function splitRangeInputByEmDash(raw: string): { leftRaw: string; rightRaw: string } {
  const idx = raw.indexOf('—')
  if (idx < 0) return { leftRaw: raw, rightRaw: '' }
  return { leftRaw: raw.slice(0, idx), rightRaw: raw.slice(idx + 1) }
}

/** Parsea un segmento "dd/mm/yyyy" completo (8 dígitos) validando que sea una fecha real. */
export function parseDdMmYyyyStringToDate(input: string): Date | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length !== 8) return null
  const d = Number(digits.slice(0, 2))
  const m = Number(digits.slice(2, 4))
  const y = Number(digits.slice(4, 8))
  if (m < 1 || m > 12) return null
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

/** Parseo best-effort de un segmento dd/mm/yyyy completo, para navegar el calendario mientras se tipea. */
export function parseSegmentForCalendarNav(
  raw: string,
): { d: number; mIndex0: number; y: number } | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 8) return null
  const d = Number(digits.slice(0, 2))
  const m = Number(digits.slice(2, 4))
  const y = Number(digits.slice(4, 8))
  if (m < 1 || m > 12) return null
  if (d < 1 || d > 31) return null
  return { d, mIndex0: m - 1, y }
}
