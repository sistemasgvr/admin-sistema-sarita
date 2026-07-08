import { formatDateTime } from '@/shared/utils/date'

export const formatDetailDate = (value?: string | null) =>
  value ? value.slice(0, 10) : undefined

export const formatDetailDateTime = (value?: string | null) =>
  value ? formatDateTime(value) : undefined

export const formatDetailMoney = (value?: number | null) => {
  if (value == null) return undefined
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

export const formatDetailDocument = (serie?: string | null, numero?: string | null) => {
  if (!serie && !numero) return undefined
  if (serie && numero) return `${serie}-${numero}`
  return serie || numero || undefined
}

export const formatDetailYesNo = (value?: boolean | null, yes = 'Sí', no = 'No') => {
  if (value == null) return undefined
  return value ? yes : no
}

export const formatDetailCapacity = (
  capacidad?: number | null,
  unidad?: string | null,
) => {
  if (capacidad == null) return undefined
  return unidad ? `${capacidad} ${unidad}` : capacidad.toString()
}

export const formatDetailPrecio = (value?: number | null) => formatDetailMoney(value)

export const formatDetailCantidad = (value?: number | null) => {
  if (value == null) return undefined
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value)
}
