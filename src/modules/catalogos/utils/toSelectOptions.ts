import type { SelectOption } from '@/shared/interfaces/form.interface'

export function toSelectOptions<T extends { id: number; nombre: string }>(
  items: T[] | undefined,
): SelectOption[] {
  return (items ?? []).map((item) => ({ label: item.nombre, value: item.id }))
}
