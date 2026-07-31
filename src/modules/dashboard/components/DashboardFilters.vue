<template>
  <div
    class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Filtros del dashboard</span>

    <AppDynamicFilters v-model="model" :fields="fields" @change="emit('change')" />

    <div v-if="resumen.length" class="flex flex-wrap items-center gap-2">
      <span
        v-for="chip in resumen"
        :key="chip"
        class="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"
      >
        {{ chip }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppDynamicFilters from '@/shared/components/filters/AppDynamicFilters.vue'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import type { ClienteListFilters } from '@/modules/clientes/interfaces/cliente.interface'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { formatListDate } from '@/shared/utils/date'

const model = defineModel<DynamicFilterValues>({ default: () => ({}) })
const emit = defineEmits<{ change: [] }>()

const clientesFilters = ref<ClienteListFilters>({
  buscar: '',
  pagina: 1,
  limite: 300,
  soloActivos: 1,
})
const clientesQuery = useClientesQuery(clientesFilters)

const clienteOptions = computed<SelectOption[]>(() =>
  (clientesQuery.data.value?.data ?? []).map((cliente) => ({
    label:
      cliente.razon_social?.trim() ||
      [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
        .filter(Boolean)
        .join(' ') ||
      cliente.numero_documento,
    value: cliente.id,
  })),
)

const fields = computed<DynamicFilterFieldDef[]>(() => [
  { key: 'fechaDesde', label: 'Desde', type: 'date' },
  { key: 'fechaHasta', label: 'Hasta', type: 'date' },
  {
    key: 'idCliente',
    label: 'Cliente',
    type: 'select',
    placeholder: 'Todos los clientes',
    options: clienteOptions.value,
  },
])

const resumen = computed<string[]>(() => {
  const chips: string[] = []
  const desde = model.value.fechaDesde
  const hasta = model.value.fechaHasta
  if (desde || hasta) {
    chips.push(`${desde ? formatListDate(String(desde)) : '…'} → ${hasta ? formatListDate(String(hasta)) : '…'}`)
  }
  if (model.value.idCliente) {
    const opt = clienteOptions.value.find((o) => o.value === Number(model.value.idCliente))
    chips.push(opt?.label ?? `Cliente #${model.value.idCliente}`)
  }
  return chips
})
</script>
