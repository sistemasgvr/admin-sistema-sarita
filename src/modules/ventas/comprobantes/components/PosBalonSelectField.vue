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
    registerLabel?: string
    emptyText?: string
  }>(),
  {
    label: 'Cilindro',
    placeholder: 'Selecciona cilindro',
    idCliente: '',
    idAlmacen: '',
    registerLabel: 'Registrar cilindro',
    emptyText: 'Sin cilindros. Registra uno nuevo.',
  },
)

const model = defineModel<number | ''>({ default: '' })

const authStore = useAuthStore()
const balonModalOpen = ref(false)

const idClienteRef = toRef(() => props.idCliente)
const idAlmacenRef = toRef(() => props.idAlmacen)

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
})

watch(
  () => props.idCliente,
  () => {
    model.value = ''
    balonBuscar.value = ''
    syncBalonFilters()
  },
)

watch(
  () => props.idAlmacen,
  () => {
    if (props.mode !== 'alquiler') return
    model.value = ''
    syncBalonFilters()
  },
)

function onBalonCreated(balon: Balon) {
  model.value = balon.id
  balonBuscar.value = balon.codigo_balon
  syncBalonFilters()
}
</script>
