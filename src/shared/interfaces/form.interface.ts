export type FormControlState = 'default' | 'error' | 'success'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
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
