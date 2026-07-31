<template>
  <AppSelectWithCreate
    :can-create="canCreate"
    create-title="Nuevo tipo de balón"
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
      :loading="loading || tiposBalonQuery.isFetching.value"
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
      :disabled="disabled || loading || tiposBalonQuery.isLoading.value"
      :required="required"
      :error="error"
      :hint="hint"
    />
  </AppSelectWithCreate>

  <TipoBalonFormModal v-model="modalOpen" mode="create" @saved="onCreated" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TipoBalonFormModal from '@/modules/balones/tipos-balon/components/TipoBalonFormModal.vue'
import { useTiposBalonQuery } from '@/modules/balones/tipos-balon/composables/useTiposBalonQuery'
import type { TipoBalon } from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'
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
    label: 'Tipo de balón',
    placeholder: 'Selecciona tipo',
    searchPlaceholder: 'Nombre del tipo...',
  },
)

const model = defineModel<string | number | '' | undefined>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const emit = defineEmits<{
  created: [tipo: TipoBalon]
}>()

const authStore = useAuthStore()
const modalOpen = ref(false)
const createdOption = ref<SelectOption | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.TIPOS_BALON_CREAR))

const tiposBalonFilters = ref({
  pagina: 1,
  limite: 200,
  buscar: undefined as string | undefined,
})
const tiposBalonQuery = useTiposBalonQuery(tiposBalonFilters)

watch(search, (term) => {
  if (!props.searchable) return
  tiposBalonFilters.value = {
    ...tiposBalonFilters.value,
    buscar: term.trim() || undefined,
  }
})

const queryOptions = computed<SelectOption[]>(() =>
  (tiposBalonQuery.data.value?.data ?? []).map((tipo) => ({
    value: tipo.id,
    label: tipo.nombre,
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

function onCreated(tipo: TipoBalon) {
  createdOption.value = {
    value: tipo.id,
    label: tipo.nombre,
  }
  model.value = tipo.id
  void tiposBalonQuery.refetch()
  emit('created', tipo)
}
</script>
