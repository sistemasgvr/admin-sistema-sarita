import { ref, watch, type Ref } from 'vue'
import type {
  DynamicFilterFieldDef,
  DynamicFilterRow,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'

const createRowId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `filter-${Date.now()}-${Math.random().toString(36).slice(2)}`

const isActiveValue = (value: unknown) =>
  value !== '' && value !== null && value !== undefined

export function buildAllFilterRows(
  fields: DynamicFilterFieldDef[],
  values: DynamicFilterValues = {},
): DynamicFilterRow[] {
  return fields.map((field) => ({
    id: createRowId(),
    fieldKey: field.key,
    value: values[field.key] ?? '',
  }))
}

export function rowsToValues(rows: DynamicFilterRow[]): DynamicFilterValues {
  const result: DynamicFilterValues = {}

  for (const row of rows) {
    if (row.fieldKey && isActiveValue(row.value)) {
      result[row.fieldKey] = row.value
    }
  }

  return result
}

export function valuesToRows(values: DynamicFilterValues): DynamicFilterRow[] {
  return Object.entries(values)
    .filter(([, value]) => isActiveValue(value))
    .map(([fieldKey, value]) => ({
      id: createRowId(),
      fieldKey,
      value: value as string | number | boolean,
    }))
}

export function useDynamicFilters(
  fields: Ref<DynamicFilterFieldDef[]>,
  modelValue: Ref<DynamicFilterValues>,
  onChange?: () => void,
  preloadAllFields = true,
) {
  const rows = ref<DynamicFilterRow[]>([])
  const isOpen = ref(false)
  let syncing = false

  const syncRowsFromFields = (values: DynamicFilterValues = modelValue.value) => {
    rows.value = buildAllFilterRows(fields.value, values)
  }

  const mergeValuesIntoRows = (values: DynamicFilterValues) => {
    if (!rows.value.length) {
      syncRowsFromFields(values)
      return
    }

    for (const row of rows.value) {
      row.value = isActiveValue(values[row.fieldKey]) ? values[row.fieldKey]! : ''
    }
  }

  const fieldDef = (fieldKey: string) =>
    fields.value.find((field) => field.key === fieldKey)

  const clearRowValue = (id: string) => {
    const row = rows.value.find((item) => item.id === id)
    if (!row) return
    row.value = ''
    emitValues()
  }

  const clearAll = () => {
    mergeValuesIntoRows({})
    emitValues()
  }

  const emitValues = () => {
    syncing = true
    modelValue.value = rowsToValues(rows.value)
    syncing = false
    onChange?.()
  }

  const onValueChange = () => {
    emitValues()
  }

  const openPanel = () => {
    if (preloadAllFields) {
      syncRowsFromFields(modelValue.value)
    } else if (!rows.value.length && fields.value.length) {
      rows.value = valuesToRows(modelValue.value)
    }
    isOpen.value = true
  }

  const closePanel = () => {
    isOpen.value = false
  }

  const activeCount = () =>
    Object.values(modelValue.value).filter(isActiveValue).length

  watch(
    fields,
    () => {
      if (preloadAllFields) {
        syncRowsFromFields(modelValue.value)
      }
    },
    { deep: true, immediate: true },
  )

  watch(
    modelValue,
    (values) => {
      if (syncing) return
      if (preloadAllFields) {
        mergeValuesIntoRows(values)
        return
      }
      rows.value = valuesToRows(values)
    },
    { deep: true },
  )

  return {
    rows,
    isOpen,
    fieldDef,
    clearRowValue,
    clearAll,
    onValueChange,
    openPanel,
    closePanel,
    activeCount,
    preloadAllFields,
  }
}
