<template>
  <AppSelectWithCreate
    :can-create="canRegister && !disabled && !balonSelectDisabled"
    :create-title="registerLabel"
    :disabled="disabled || balonSelectDisabled"
    @create="balonModalOpen = true"
  >
    <AppSelectSearch
      v-model="model"
      v-model:search="balonBuscar"
      remote
      :label="label"
      :placeholder="placeholder"
      :required="required"
      :error="error"
      :hint="hint"
      search-placeholder="Código, serie o tipo..."
      :options="balonOptions"
      :loading="balonesQuery.isFetching.value"
      :disabled="disabled || balonSelectDisabled || balonesQuery.isLoading.value"
      :empty-text="resolvedEmptyText"
    />
  </AppSelectWithCreate>

  <BalonFormModal
    v-if="canRegister"
    v-model="balonModalOpen"
    mode="create"
    :preset="balonPreset"
    @created="onBalonCreated"
  />
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch, type Ref } from 'vue'
import BalonFormModal from '@/modules/balones/cilindros/components/BalonFormModal.vue'
import type {
  Balon,
  BalonListFilters,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import {
  usePosBalonSelect,
  type PosBalonSelectMode,
} from '@/modules/ventas/comprobantes/composables/usePosBalonSelect'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppSelectSearch, AppSelectWithCreate } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    error?: string
    hint?: string
    mode: PosBalonSelectMode
    idCliente?: number | ''
    idAlmacen?: number | ''
    /** Ej. medicinal: solo cilindros de esa familia de gas */
    familiaGas?: string
    registerLabel?: string
    emptyText?: string
    extraFilters?: Partial<BalonListFilters>
    clientFilter?: (balon: Balon) => boolean
    /** Bloquea selección hasta que el padre habilite (ej. tipo de movimiento). */
    selectionLocked?: boolean
  }>(),
  {
    label: 'Cilindro',
    placeholder: 'Selecciona cilindro',
    idCliente: '',
    idAlmacen: '',
    familiaGas: undefined,
    registerLabel: 'Registrar cilindro',
    emptyText: 'Sin cilindros. Registra uno nuevo.',
    hint: undefined,
    extraFilters: undefined,
    clientFilter: undefined,
    selectionLocked: false,
  },
)

const model = defineModel<number | ''>({ default: '' })
/** Etiqueta legible del cilindro seleccionado (código · tipo · …). */
const etiqueta = defineModel<string>('etiqueta', { default: '' })

const emit = defineEmits<{
  /** Balón completo de la lista actual (capacidad, gas, etc.). */
  selected: [balon: Balon | null]
}>()

const authStore = useAuthStore()
const balonModalOpen = ref(false)

const idClienteRef = toRef(() => props.idCliente)
const idAlmacenRef = toRef(() => props.idAlmacen)
const familiaGasRef = toRef(() => props.familiaGas)
const extraFiltersRef = toRef(() => props.extraFilters) as Ref<
  Partial<BalonListFilters> | undefined
>
const clientFilterRef = toRef(() => props.clientFilter) as Ref<
  ((balon: Balon) => boolean) | undefined
>
const selectionLockedRef = toRef(() => props.selectionLocked)

const canRegister = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_CREAR))

const {
  balonBuscar,
  balonesQuery,
  balonOptions,
  balonPreset,
  balonSelectDisabled,
  syncBalonFilters,
} = usePosBalonSelect({
  mode: props.mode,
  idCliente: idClienteRef,
  idAlmacen: idAlmacenRef,
  familiaGas: familiaGasRef,
  extraFilters: extraFiltersRef,
  clientFilter: clientFilterRef,
  selectionLocked: selectionLockedRef,
})

const resolvedEmptyText = computed(() => {
  if (props.selectionLocked) {
    return 'Primero selecciona el tipo de movimiento.'
  }
  return props.emptyText
})

function resolveSelectedBalon(): Balon | null {
  if (!model.value) return null
  const rows = balonesQuery.data.value?.data ?? []
  return rows.find((item) => item.id === Number(model.value)) ?? null
}

function syncEtiqueta() {
  if (!model.value) {
    etiqueta.value = ''
    return
  }
  const opt = balonOptions.value.find((item) => item.value === model.value)
  etiqueta.value = opt?.title || opt?.label || etiqueta.value
}

function emitSelected() {
  emit('selected', resolveSelectedBalon())
}

watch(
  () => props.idCliente,
  () => {
    model.value = ''
    etiqueta.value = ''
    balonBuscar.value = ''
    syncBalonFilters()
  },
)

watch(
  () => props.idAlmacen,
  () => {
    if (props.mode !== 'alquiler') return
    model.value = ''
    etiqueta.value = ''
    syncBalonFilters()
  },
)

watch(
  () => props.familiaGas,
  () => {
    model.value = ''
    etiqueta.value = ''
    syncBalonFilters()
  },
)

// Si el valor ya no está en el listado filtrado (p. ej. era propio del cliente), limpiarlo.
// No limpiar mientras carga: la lista puede venir vacía de forma temporal.
watch(balonOptions, (options) => {
  if (!model.value) {
    etiqueta.value = ''
    emitSelected()
    return
  }
  if (balonesQuery.isLoading.value || balonesQuery.isFetching.value) return
  const stillValid = options.some((opt) => opt.value === model.value)
  if (!stillValid) {
    model.value = ''
    etiqueta.value = ''
    emitSelected()
    return
  }
  syncEtiqueta()
  emitSelected()
})

watch(model, () => {
  syncEtiqueta()
  emitSelected()
})

function onBalonCreated(balon: Balon) {
  model.value = balon.id
  balonBuscar.value = balon.codigo_balon
  etiqueta.value = balon.codigo_balon
  syncBalonFilters()
  emit('selected', balon)
}
</script>
