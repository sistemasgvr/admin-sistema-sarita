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
import {
  useDocumentoSalidaQuery,
  useDocumentosSalidaQuery,
} from '@/modules/documentos-salida/composables/useDocumentosSalidaQuery'
import type { CodigoTipoOrdenSalida } from '@/modules/documentos-salida/interfaces/documento-salida.interface'
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
    codigoTipoOrden?: CodigoTipoOrdenSalida
  }>(),
  {
    label: 'Documento de salida',
    placeholder: 'Selecciona documento de salida',
    searchPlaceholder: 'Número, serie o cliente...',
    required: false,
    disabled: false,
    loading: false,
    hint: undefined,
    help: undefined,
    codigoTipoOrden: undefined,
  },
)

const model = defineModel<number | ''>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const filters = ref({ buscar: '', pagina: 1, limite: 30, codigoTipoOrden: props.codigoTipoOrden })

let searchTimeout: ReturnType<typeof setTimeout> | undefined
watch(search, (term) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value = { ...filters.value, buscar: term.trim() }
  }, 300)
})

const listQuery = useDocumentosSalidaQuery(filters)

const selectedIdRef = computed(() => (model.value !== '' ? Number(model.value) : null))
const selectedQuery = useDocumentoSalidaQuery(selectedIdRef)

function formatLabel(d: { numero: string; serie?: string | null; numero_sunat?: string | null; nombre_cliente?: string | null; nombre_destinatario?: string | null }) {
  const doc = d.serie && d.numero_sunat ? `${d.serie}-${d.numero_sunat}` : d.numero
  const dest = d.nombre_destinatario || d.nombre_cliente
  return dest ? `${doc} · ${dest}` : doc
}

const listOptions = computed<SelectOption[]>(() =>
  (listQuery.data.value?.data ?? []).map((d) => ({ value: d.id, label: formatLabel(d) })),
)

const selectedOption = computed<SelectOption | null>(() => {
  const doc = selectedQuery.data.value
  if (!doc) return null
  return { value: doc.id, label: formatLabel(doc) }
})

const mergedOptions = computed(() => {
  const map = new Map<string | number, SelectOption>()
  for (const opt of listOptions.value) map.set(opt.value, opt)
  if (selectedOption.value) map.set(selectedOption.value.value, selectedOption.value)
  return [...map.values()]
})
</script>
