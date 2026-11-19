import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'

/**
 * Disponibilidad de una acción para un registro, separando dos cosas que antes
 * iban juntas en `hidden` (ver docs/RESPUESTA-REVISION-PREVENTIVA.md §2):
 *
 * - `aplica: false` → la acción no tiene sentido para este registro nunca
 *   (p. ej. «Nota de crédito» sobre una nota de venta): se oculta.
 * - `motivo` → la acción sí corresponde, pero todavía no (p. ej. el XML antes
 *   de que SUNAT acepte): se muestra deshabilitada con el motivo, para que el
 *   usuario no concluya que el sistema «no lo tiene» (reclamo del 18/11).
 */
export interface Disponibilidad {
  aplica: boolean
  motivo: string | null
}

export const disponible: Disponibilidad = { aplica: true, motivo: null }
export const noAplica: Disponibilidad = { aplica: false, motivo: null }
export const bloqueada = (motivo: string): Disponibilidad => ({ aplica: true, motivo })

/**
 * Propiedades `hidden` / `disabled` / `disabledReason` de un ítem de menú.
 * La falta de permiso siempre oculta: si no es tu función, no te estorba.
 */
export function estadoAccion(
  permitido: boolean,
  disponibilidad: Disponibilidad,
  ocupado = false,
): Pick<ActionMenuItem, 'hidden' | 'disabled' | 'disabledReason'> {
  return {
    hidden: !permitido || !disponibilidad.aplica,
    disabled: ocupado || disponibilidad.motivo !== null,
    disabledReason: disponibilidad.motivo ?? undefined,
  }
}
