import type { BadgeColor } from '@/shared/interfaces/badge.interface'

export type FormControlState = 'default' | 'error' | 'success'

export interface SelectOptionBadge {
  label: string
  color?: BadgeColor
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  /** Texto principal en el disparador / opción (si no hay, se usa `label`). */
  title?: string
  /** Badges visuales en el listado del select (p. ej. gas, estado, almacén). */
  badges?: SelectOptionBadge[]
}
export interface RangoFechas {
  start: string
  end: string
}

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local'
