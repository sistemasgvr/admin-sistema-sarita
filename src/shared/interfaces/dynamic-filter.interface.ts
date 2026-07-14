import type { SelectOption } from '@/shared/interfaces/form.interface'

export type DynamicFilterFieldType = 'select' | 'text' | 'date' | 'checkbox'

export interface DynamicFilterFieldDef {
  key: string
  label: string
  type: DynamicFilterFieldType
  placeholder?: string
  options?: SelectOption[]
  disabled?: boolean
}

export interface DynamicFilterRow {
  id: string
  fieldKey: string
  value: string | number | boolean | null
}

export type DynamicFilterValues = Record<
  string,
  string | number | boolean | null | undefined
>
