<template>
  <AppSelectWithCreate
    :can-create="canCreate"
    :create-title="createTitle"
    :disabled="disabled"
    :has-label="Boolean(label?.trim())"
    @create="onCreate"
  >
    <AppSelectSearch
      v-model="model"
      v-model:search="search"
      remote
      :label="label"
      :placeholder="placeholder"
      :search-placeholder="searchPlaceholder"
      :options="mergedOptions"
      :loading="loading || guiasQuery.isFetching.value"
      :disabled="disabled"
      :required="required"
      :error="error"
      :hint="hint"
      :help="help"
      clearable
    />
  </AppSelectWithCreate>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useGuiaRemisionQuery,
  useGuiasRemisionQuery,
} from '@/modules/ventas/guias-remision/composables/useGuiasRemisionQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppSelectSearch, AppSelectWithCreate } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    searchPlaceholder?: string
    createTitle?: string
    required?: boolean
    disabled?: boolean
    loading?: boolean
    error?: string
    hint?: string
    help?: string
    /** Ruta relativa a la que volver tras crear la GRE (ej. /admin/balones/recargas/planta/nueva). */
    returnTo?: string
    /** Contexto para preconfigurar la GRE (recarga-planta = vacíos EMPRESA). */
    origen?: 'recarga-planta' | null
    /** Query param al volver (ej. idGuiaSalida). */
    returnIdParam?: string
  }>(),
  {
    label: 'Guía de remisión',
    placeholder: 'Selecciona guía de remisión',
    searchPlaceholder: 'Serie, número o destinatario...',
    createTitle: 'Nueva guía de remisión',
    required: false,
    disabled: false,
    loading: false,
    hint: undefined,
    help: undefined,
    returnTo: undefined,
    origen: null,
    returnIdParam: 'idGuiaSalida',
  },
)

const model = defineModel<number | ''>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const authStore = useAuthStore()
const router = useRouter()

const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.GUIAS_REMISION_CREAR),
)

const filters = ref({
  buscar: '',
  pagina: 1,
  limite: 30,
})

let searchTimeout: ReturnType<typeof setTimeout> | undefined

watch(search, (term) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value = {
      ...filters.value,
      buscar: term.trim(),
    }
  }, 300)
})

const guiasQuery = useGuiasRemisionQuery(filters)

const selectedIdRef = computed(() => (model.value !== '' ? Number(model.value) : null))
const selectedGuiaQuery = useGuiaRemisionQuery(selectedIdRef)

const formatGuiaLabel = (g: {
  serie: string
  numero: string
  nombre_destinatario?: string | null
}) => {
  const doc = `${g.serie}-${g.numero}`
  const dest = g.nombre_destinatario ? ` · ${g.nombre_destinatario}` : ''
  return `${doc}${dest}`
}

const listOptions = computed<SelectOption[]>(() =>
  (guiasQuery.data.value?.data ?? []).map((g) => ({
    value: g.id,
    label: formatGuiaLabel(g),
  })),
)

const selectedOption = computed<SelectOption | null>(() => {
  const guia = selectedGuiaQuery.data.value
  if (!guia) return null
  return { value: guia.id, label: formatGuiaLabel(guia) }
})

const mergedOptions = computed(() => {
  const map = new Map<string | number, SelectOption>()
  for (const opt of listOptions.value) {
    map.set(opt.value, opt)
  }
  if (selectedOption.value) {
    map.set(selectedOption.value.value, selectedOption.value)
  }
  return [...map.values()]
})

function onCreate() {
  const query: Record<string, string> = {}
  if (props.origen) {
    query.origen = props.origen
  }
  if (props.returnTo) {
    query.returnTo = props.returnTo
  }
  if (props.returnIdParam) {
    query.returnIdParam = props.returnIdParam
  }
  void router.push({
    name: 'admin-ventas-guias-remision-nueva',
    query,
  })
}
</script>
