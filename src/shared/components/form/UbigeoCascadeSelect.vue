<template>
  <div class="grid grid-cols-2 gap-3">
    <AppSelect
      v-model="idPais"
      label="País"
      :placeholder="paisesQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
      :options="paisesOptions"
      :disabled="disabled || paisesQuery.isLoading.value"
    />
    <AppSelect
      v-model="idDepartamento"
      label="Departamento"
      :placeholder="!idPais ? 'Selecciona un país' : departamentosQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
      :options="departamentosOptions"
      :disabled="disabled || !idPais || departamentosQuery.isLoading.value"
    />
    <AppSelect
      v-model="idProvincia"
      label="Provincia"
      :placeholder="!idDepartamento ? 'Selecciona un departamento' : provinciasQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
      :options="provinciasOptions"
      :disabled="disabled || !idDepartamento || provinciasQuery.isLoading.value"
    />
    <AppSelect
      v-model="idDistrito"
      label="Distrito"
      :placeholder="!idProvincia ? 'Selecciona una provincia' : distritosQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
      :options="distritosOptions"
      :disabled="disabled || !idProvincia || distritosQuery.isLoading.value"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import {
  useDepartamentosQuery,
  useDistritosQuery,
  usePaisesQuery,
  useProvinciasQuery,
} from '@/modules/catalogos/composables/useUbigeoQueries'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { AppSelect } from '@/shared/components'

// Cascada país → departamento → provincia → distrito reutilizable, calcada
// del patrón de DireccionFormModal.vue. Cambiar un nivel resetea los
// niveles hijos, salvo mientras se está precargando un valor existente
// (ver watch de props.presetTrigger).
defineProps<{
  disabled?: boolean
}>()

const idPais = defineModel<number | undefined>('idPais')
const idDepartamento = defineModel<number | undefined>('idDepartamento')
const idProvincia = defineModel<number | undefined>('idProvincia')
const idDistrito = defineModel<number | undefined>('idDistrito')

/** Mientras es true, los watch de reseteo en cascada no actúan (usado al precargar valores existentes). */
const presetting = defineModel<boolean>('presetting', { default: false })

const paisesQuery = usePaisesQuery()
const departamentosQuery = useDepartamentosQuery(idPais)
const provinciasQuery = useProvinciasQuery(idDepartamento)
const distritosQuery = useDistritosQuery(idProvincia)

const paisesOptions = computed(() => toSelectOptions(paisesQuery.data.value))
const departamentosOptions = computed(() => toSelectOptions(departamentosQuery.data.value))
const provinciasOptions = computed(() => toSelectOptions(provinciasQuery.data.value))
const distritosOptions = computed(() => toSelectOptions(distritosQuery.data.value))

watch(idPais, () => {
  if (presetting.value) return
  idDepartamento.value = undefined
  idProvincia.value = undefined
  idDistrito.value = undefined
})

watch(idDepartamento, () => {
  if (presetting.value) return
  idProvincia.value = undefined
  idDistrito.value = undefined
})

watch(idProvincia, () => {
  if (presetting.value) return
  idDistrito.value = undefined
})

defineExpose({
  /** Espera a que las opciones del nivel pedido incluyan el id, útil tras precargar. */
  async waitForLevel(level: 'departamento' | 'provincia' | 'distrito', id: number, attempts = 20) {
    const getOptions = () =>
      level === 'departamento'
        ? departamentosOptions.value
        : level === 'provincia'
          ? provinciasOptions.value
          : distritosOptions.value
    for (let i = 0; i < attempts; i += 1) {
      if (getOptions().some((o) => Number(o.value) === id)) return true
      await new Promise((resolve) => setTimeout(resolve, 50))
      await nextTick()
    }
    return false
  },
})
</script>
