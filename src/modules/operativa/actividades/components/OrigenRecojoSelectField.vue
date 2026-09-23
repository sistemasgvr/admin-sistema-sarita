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

const emit = defineEmits<{ selected: [row: OrigenVencidoRecojo | null] }>()

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
    placeholder: 'Selecciona préstamo o alquiler pendiente...',
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
  incluirNoVencidos: true,
  buscar: '',
  pagina: 1,
  // Todos los activos, no solo los primeros 30: el selector se abre con el
  // listado completo (la búsqueda por número/cliente/tipo sigue disponible).
  limite: 200,
})

let searchTimeout: ReturnType<typeof setTimeout> | undefined
watch(search, (term) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value = { ...filters.value, buscar: term.trim() }
  }, 300)
})

watch(() => props.prefillLabel, label => {
  if (label && model.value) filters.value.buscar = label
}, { immediate: true })

const listQuery = useVencidosRecojoQuery(filters)

function formatLabel(row: OrigenVencidoRecojo) {
  const dias =
    !row.fecha_pactada ? 'Sin fecha pactada' : row.dias_vencido > 0 ? `${row.dias_vencido} día(s) vencido(s)` : row.dias_vencido === 0 ? 'Vence hoy' : 'Recojo anticipado disponible'
  const cliente = row.nombre_cliente ? ` · ${row.nombre_cliente}` : ''
  return `${row.numero}${cliente} · ${dias}`
}

/**
 * Estado del plazo pactado, para el badge de cada opción:
 * - más de 3 días de margen → En tiempo (OK)
 * - vence hoy o dentro de los próximos 3 días → Plazo normal (por vencer)
 * - ya pasó la fecha → Vencido (Xd)
 * - sin fecha pactada → sin información
 */
function badgesOrigen(row: OrigenVencidoRecojo) {
  const tipo: { label: string; color: 'primary' | 'warning' } = {
    label: row.origen === 'ALQUILER' ? 'Alquiler' : 'Préstamo',
    color: row.origen === 'ALQUILER' ? 'primary' : 'warning',
  }

  let estado: { label: string; color: 'success' | 'warning' | 'error' | 'neutral' }
  if (!row.fecha_pactada) {
    estado = { label: 'Sin fecha pactada', color: 'neutral' }
  } else if (row.dias_vencido > 0) {
    estado = { label: `Vencido (${row.dias_vencido}d)`, color: 'error' }
  } else if (row.dias_vencido >= -3) {
    estado = {
      label: row.dias_vencido === 0 ? 'Plazo normal · vence hoy' : `Plazo normal · vence en ${-row.dias_vencido}d`,
      color: 'warning',
    }
  } else {
    estado = { label: 'En tiempo (OK)', color: 'success' }
  }

  const recojo = row.recojo_abierto
    ? [{ label: `Recojo abierto #${row.recojo_abierto}`, color: 'dark' as const }]
    : []

  return [tipo, estado, ...recojo]
}

const listOptions = computed<SelectOption[]>(() =>
  (listQuery.data.value?.data ?? []).map((row) => ({
    value: origenRecojoKey(row.origen, row.id_origen),
    label: formatLabel(row),
    badges: badgesOrigen(row),
    // Con recojo ya abierto no es elegible: se lista para que se vea el
    // activo, pero no se puede volver a programar desde aquí.
    disabled: !!row.recojo_abierto,
  })),
)

const selectedFromList = computed(() => {
  const key = model.value
  if (!key) return null
  return (listQuery.data.value?.data ?? []).find(
    (row) => origenRecojoKey(row.origen, row.id_origen) === key,
  ) ?? null
})

watch(selectedFromList, row => emit('selected', row), { immediate: true })

const selectedOption = computed<SelectOption | null>(() => {
  const row = selectedFromList.value
  if (row) {
    return {
      value: origenRecojoKey(row.origen, row.id_origen),
      label: formatLabel(row),
      badges: badgesOrigen(row),
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
