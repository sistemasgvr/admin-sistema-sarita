/** Valores persistidos en ven_comprobante.origen_pos */
export const OrigenPos = {
  ACCESORIOS: 'accesorios',
  RECARGA: 'recarga',
  MEDICINAL: 'medicinal',
  INDUSTRIAL: 'industrial',
  MANTENIMIENTO: 'mantenimiento',
} as const

export type OrigenPosValue = (typeof OrigenPos)[keyof typeof OrigenPos]

export function isOrigenPos(value: string | null | undefined): value is OrigenPosValue {
  return (
    value === OrigenPos.ACCESORIOS ||
    value === OrigenPos.RECARGA ||
    value === OrigenPos.MEDICINAL ||
    value === OrigenPos.INDUSTRIAL ||
    value === OrigenPos.MANTENIMIENTO
  )
}
