import type { SelectOption } from '@/shared/interfaces/form.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

export function toSelectOptions<
  T extends { id: number; nombre: string; descripcion?: string | null },
>(
  items: T[] | undefined,
): SelectOption[] {
  return (items ?? []).map((item) => ({
    label: formatListaOpcionLabel(item.nombre, item.descripcion),
    value: item.id,
  }))
}
