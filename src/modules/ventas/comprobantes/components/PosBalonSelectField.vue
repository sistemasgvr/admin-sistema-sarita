<template>
  <div class="flex w-full min-w-0 items-end gap-2">
    <div class="min-w-0 flex-1 overflow-hidden">
      <AppSelectSearch
        v-model="model"
        v-model:search="balonBuscar"
        remote
        :label="label"
        :placeholder="placeholder"
        :required="required"
        search-placeholder="Código, serie o tipo..."
        :options="balonOptions"
        :loading="balonesQuery.isFetching.value"
        :disabled="disabled || balonSelectDisabled || balonesQuery.isLoading.value"
        :empty-text="emptyText"
      />
    </div>

    <button
      v-if="canRegister && !disabled && !balonSelectDisabled"
      type="button"
      class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
      :title="registerLabel"
      @click="balonModalOpen = true"
    >
      <AppIcon :name="ICONS.plus" :size="18" />
    </button>

    <BalonFormModal
      v-if="canRegister"
      v-model="balonModalOpen"
      mode="create"
      :preset="balonPreset"
      @created="onBalonCreated"
    />
  </div>
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
import { AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
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
