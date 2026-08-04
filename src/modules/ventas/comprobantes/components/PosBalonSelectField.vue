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
      search-placeholder="Código, serie o tipo..."
      :options="balonOptions"
      :loading="balonesQuery.isFetching.value"
      :disabled="disabled || balonSelectDisabled || balonesQuery.isLoading.value"
      :empty-text="emptyText"
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
import { computed, ref, toRef, watch } from 'vue'
import BalonFormModal from '@/modules/balones/cilindros/components/BalonFormModal.vue'
import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'
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
    mode: PosBalonSelectMode
    idCliente?: number | ''
    idAlmacen?: number | ''
    /** Ej. medicinal: solo cilindros de esa familia de gas */
    familiaGas?: string
    registerLabel?: string
    emptyText?: string
  }>(),
  {
    label: 'Cilindro',
    placeholder: 'Selecciona cilindro',
    idCliente: '',
    idAlmacen: '',
    familiaGas: undefined,
    registerLabel: 'Registrar cilindro',
    emptyText: 'Sin cilindros. Registra uno nuevo.',
  },
)

const model = defineModel<number | ''>({ default: '' })
/** Etiqueta legible del cilindro seleccionado (código · tipo · …). */
const etiqueta = defineModel<string>('etiqueta', { default: '' })

const authStore = useAuthStore()
const balonModalOpen = ref(false)

const idClienteRef = toRef(() => props.idCliente)
const idAlmacenRef = toRef(() => props.idAlmacen)
const familiaGasRef = toRef(() => props.familiaGas)

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
})

function syncEtiqueta() {
  if (!model.value) {
    etiqueta.value = ''
    return
  }
  const opt = balonOptions.value.find((item) => item.value === model.value)
  etiqueta.value = opt?.label ?? etiqueta.value
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
    return
  }
  if (balonesQuery.isLoading.value || balonesQuery.isFetching.value) return
  const stillValid = options.some((opt) => opt.value === model.value)
  if (!stillValid) {
    model.value = ''
    etiqueta.value = ''
    return
  }
  syncEtiqueta()
})

watch(model, () => {
  syncEtiqueta()
})

function onBalonCreated(balon: Balon) {
  model.value = balon.id
  balonBuscar.value = balon.codigo_balon
  etiqueta.value = balon.codigo_balon
  syncBalonFilters()
}
</script>
