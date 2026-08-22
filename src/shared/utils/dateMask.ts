
export function formatDateInputMasked(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  const d = digits.slice(0, 2)
  const m = digits.slice(2, 4)
  const y = digits.slice(4, 8)
  let out = d
  if (m) out += '/' + m
  if (y) out += '/' + y
  return out
}

export function dateInputDigitIndexAtCursor(raw: string, cursorPos: number): number {
  let count = 0
  for (let i = 0; i < Math.min(cursorPos, raw.length); i++) {
    if (/\d/.test(raw[i])) count++
  }
  return count
}
export function cursorPositionForDateFormatted(formatted: string, digitIdx: number): number {
  if (digitIdx <= 0) return 0

  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (!/\d/.test(formatted[i])) continue
    seen++
    if (seen === digitIdx) return i + 1
  }
  return formatted.length
}

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

export function parseDateSegmentForCalendarNav(
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
