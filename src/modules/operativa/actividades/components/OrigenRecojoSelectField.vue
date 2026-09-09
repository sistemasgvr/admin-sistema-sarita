<template>
  <AppSelectSearch
    v-model="model"
    v-model:search="search"
    remote
    :label="label"
    :placeholder="placeholder"
    :search-placeholder="searchPlaceholder"
    :options="mergedOptions"
    :loading="loading || listQuery.isFetching.value"
    :disabled="disabled"
    :required="required"
    :error="error"
    :hint="hint"
    :help="help"
    clearable
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useVencidosRecojoQuery } from '@/modules/operativa/actividades/composables/useVencidosRecojoQuery'
import type { OrigenVencidoRecojo } from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { origenRecojoKey } from '@/modules/operativa/actividades/utils/origenRecojoKey'
import { AppSelectSearch } from '@/shared/components'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    searchPlaceholder?: string
    required?: boolean
    disabled?: boolean
    loading?: boolean
    error?: string
    hint?: string
    help?: string
    /** Label cuando el valor viene prefill y no está en el listado remoto. */
    prefillLabel?: string | null
  }>(),
  {
    label: 'Origen del recojo',
    placeholder: 'Selecciona préstamo o alquiler vencido...',
    searchPlaceholder: 'Número, cliente o tipo...',
    required: false,
    disabled: false,
    loading: false,
    hint: undefined,
    help: undefined,
    prefillLabel: null,
  },
)

/** Valor compuesto `PRESTAMO:12` / `ALQUILER:5`. */
const model = defineModel<string | ''>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const filters = ref({
  buscar: '',
  pagina: 1,
  limite: 30,
})

let searchTimeout: ReturnType<typeof setTimeout> | undefined
watch(search, (term) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value = { ...filters.value, buscar: term.trim() }
  }, 300)
})

const listQuery = useVencidosRecojoQuery(filters)

function formatLabel(row: OrigenVencidoRecojo) {
  const dias =
    row.dias_vencido === 1 ? '1 día vencido' : `${row.dias_vencido} días vencidos`
  const cliente = row.nombre_cliente ? ` · ${row.nombre_cliente}` : ''
  return `${row.numero}${cliente} · ${dias}`
}

const listOptions = computed<SelectOption[]>(() =>
  (listQuery.data.value?.data ?? []).map((row) => ({
    value: origenRecojoKey(row.origen, row.id_origen),
    label: formatLabel(row),
    badges: [
      {
        label: row.origen === 'ALQUILER' ? 'Alquiler' : 'Préstamo',
        color: row.origen === 'ALQUILER' ? 'primary' : 'warning',
      },
    ],
  })),
)

const selectedFromList = computed(() => {
  const key = model.value
  if (!key) return null
  return (listQuery.data.value?.data ?? []).find(
    (row) => origenRecojoKey(row.origen, row.id_origen) === key,
  ) ?? null
})

const selectedOption = computed<SelectOption | null>(() => {
  const row = selectedFromList.value
  if (row) {
    return {
      value: origenRecojoKey(row.origen, row.id_origen),
      label: formatLabel(row),
      badges: [
        {
          label: row.origen === 'ALQUILER' ? 'Alquiler' : 'Préstamo',
          color: row.origen === 'ALQUILER' ? 'primary' : 'warning',
        },
      ],
    }
  }
  if (model.value && props.prefillLabel) {
    const parsed = model.value.startsWith('ALQUILER:') ? 'Alquiler' : 'Préstamo'
    return {
      value: model.value,
      label: props.prefillLabel,
      badges: [
        {
          label: parsed,
          color: parsed === 'Alquiler' ? 'primary' : 'warning',
        },
      ],
    }
  }
  return null
})

const mergedOptions = computed(() => {
  const map = new Map<string | number, SelectOption>()
  for (const opt of listOptions.value) map.set(opt.value, opt)
  if (selectedOption.value) map.set(selectedOption.value.value, selectedOption.value)
  return [...map.values()]
})

defineExpose({
  selected: selectedFromList,
  list: computed(() => listQuery.data.value?.data ?? []),
})
</script>
