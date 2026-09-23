import { validationMessages as msg } from '@/shared/validation/messages'

export const DOCUMENTO_MAX_LENGTH = {
  DNI: 8,
  RUC: 20,
  OTRO: 25,
} as const

const normalizarTipo = (tipo?: string | null) => tipo?.trim().toUpperCase()

export function maxLengthDocumento(tipo?: string | null): number {
  const t = normalizarTipo(tipo)
  if (t === 'DNI') return DOCUMENTO_MAX_LENGTH.DNI
  if (t === 'RUC') return DOCUMENTO_MAX_LENGTH.RUC
  return DOCUMENTO_MAX_LENGTH.OTRO
}

export function esSoloDigitosSegunTipo(tipo?: string | null): boolean {
  const t = normalizarTipo(tipo)
  return t === 'DNI' || t === 'RUC'
}

export function sanitizeNumeroDocumento(tipo: string | null | undefined, raw: string): string {
  const filtrado = esSoloDigitosSegunTipo(tipo) ? raw.replace(/\D/g, '') : raw.replace(/[^a-zA-Z0-9]/g, '')
  return filtrado.slice(0, maxLengthDocumento(tipo))
}

export function inferirTipoDocumentoPorNumero(numero?: string | null): 'DNI' | 'RUC' | null {
  const digits = String(numero ?? '').replace(/\D/g, '')
  if (digits.length === 8) return 'DNI'
  if (digits.length === 11) return 'RUC'
  return null
}

export function placeholderNumeroDocumento(tipo?: string | null): string {
  const t = normalizarTipo(tipo)
  if (t === 'DNI') return '12345678'
  if (t === 'RUC') return '20123456789'
  return 'Número de documento'
}

export function formatoDocumentoError(tipo: string | null | undefined, value: string): string | null {
  const t = normalizarTipo(tipo)
  const max = maxLengthDocumento(tipo)

  if (t === 'DNI') {
    return /^\d+$/.test(value) && value.length <= max ? null : msg.documentDni
  }

  if (t === 'RUC') {
    return /^\d+$/.test(value) && value.length <= max ? null : msg.documentRuc
  }

  return /^[a-zA-Z0-9]+$/.test(value) && value.length <= max ? null : msg.documentOtro
}
