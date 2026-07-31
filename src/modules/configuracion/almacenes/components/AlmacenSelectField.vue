<template>
  <AppSelectWithCreate
    :can-create="canCreate"
    create-title="Nuevo almacén"
    :disabled="disabled"
    @create="modalOpen = true"
  >
    <AppSelectSearch
      v-if="searchable"
      v-model="model"
      v-model:search="search"
      remote
      :label="label"
      :placeholder="placeholder"
      :search-placeholder="searchPlaceholder"
      :options="mergedOptions"
      :loading="loading || almacenesQuery.isFetching.value"
      :disabled="disabled"
      :required="required"
      :error="error"
      :hint="hint"
    />
    <AppSelect
      v-else
      v-model="model"
      :label="label"
      :placeholder="placeholder"
      :options="mergedOptions"
      :disabled="disabled || loading || almacenesQuery.isLoading.value"
      :required="required"
      :error="error"
      :hint="hint"
    />
  </AppSelectWithCreate>

  <AlmacenFormModal v-model="modalOpen" mode="create" @saved="onCreated" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AlmacenFormModal from '@/modules/configuracion/almacenes/components/AlmacenFormModal.vue'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppSelect, AppSelectSearch, AppSelectWithCreate } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const props = withDefaults(
  defineProps<{
    options?: SelectOption[]
    loading?: boolean
    disabled?: boolean
    required?: boolean
    searchable?: boolean
    label?: string
    placeholder?: string
    searchPlaceholder?: string
    error?: string
    hint?: string
  }>(),
  {
    options: undefined,
    loading: false,
    disabled: false,
    required: false,
    searchable: false,
    label: 'Almacén',
    placeholder: 'Selecciona almacén',
    searchPlaceholder: 'Nombre del almacén...',
  },
)

const model = defineModel<string | number | '' | undefined>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const emit = defineEmits<{
  created: [almacen: Almacen]
}>()

const authStore = useAuthStore()
const modalOpen = ref(false)
const createdOption = ref<SelectOption | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.ALMACENES_CREAR))

const almacenesFilters = ref({
  pagina: 1,
  limite: 200,
  buscar: undefined as string | undefined,
})
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

watch(search, (term) => {
  if (!props.searchable) return
  almacenesFilters.value = {
    ...almacenesFilters.value,
    buscar: term.trim() || undefined,
  }
})

const queryOptions = computed<SelectOption[]>(() =>
  (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
)

const mergedOptions = computed(() => {
  const base = props.options?.length ? props.options : queryOptions.value
  if (!createdOption.value) return base
  if (base.some((opt) => String(opt.value) === String(createdOption.value!.value))) {
    return base
  }
  return [createdOption.value, ...base]
})

function onCreated(almacen: Almacen) {
  createdOption.value = {
    value: almacen.id,
    label: almacen.nombre,
  }
  model.value = almacen.id
  void almacenesQuery.refetch()
  emit('created', almacen)
}
</script>
