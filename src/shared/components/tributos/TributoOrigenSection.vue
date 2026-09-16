<template>
  <section class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900" :aria-label="titulo">
    <label class="flex items-center gap-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
      <input type="checkbox" :checked="!!model" :disabled="disabled" @change="toggle(($event.target as HTMLInputElement).checked)" />
      Preparar {{ titulo.toLowerCase() }} con este comprobante
    </label>
    <p class="mt-2 text-xs text-gray-500">Se guarda vinculada al comprobante, pendiente de emisión. La empresa y la contraparte se toman de esta operación.</p>
    <fieldset v-if="model" :disabled="disabled" class="mt-4 space-y-3">
      <p class="text-sm text-gray-600 dark:text-gray-300">Empresa: {{ empresa.data.value?.razon_social || empresa.data.value?.nombre_comercial || 'Selecciona una empresa' }} · RUC {{ empresa.data.value?.ruc || '—' }}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="text-sm">Serie
          <input v-model="model.serie" class="mt-1 block w-full rounded border p-2 dark:bg-gray-800" maxlength="4" @input="model.serie = model.serie.toUpperCase()" />
        </label>
        <label class="text-sm">Fecha de {{ titulo.toLowerCase() }}
          <input v-model="model.fechaEmision" type="date" class="mt-1 block w-full rounded border p-2 dark:bg-gray-800" />
        </label>
        <label class="text-sm">Régimen
          <select v-model="model.regimen" aria-label="Régimen" class="mt-1 block w-full rounded border p-2 dark:bg-gray-800">
            <option value="">Selecciona un régimen</option>
            <option v-for="op in regimenes" :key="op.id" :value="op.descripcion">{{ op.nombre }}</option>
          </select>
        </label>
        <label class="text-sm">Tasa (%)
          <input v-model.number="model.tasa" type="number" min="0.01" max="100" step="0.01" class="mt-1 block w-full rounded border p-2 dark:bg-gray-800" />
        </label>
        <label class="text-sm">Base de la operación (S/)
          <input v-model.number="model.baseImponible" type="number" min="0.01" :max="total" step="0.01" class="mt-1 block w-full rounded border p-2 dark:bg-gray-800" />
        </label>
        <div class="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
          <p>{{ titulo }}: <strong>S/ {{ monto.toFixed(2) }}</strong></p>
          <p>Importe {{ tipo === 'percepcion' ? 'con percepción' : 'neto de retención' }}: S/ {{ neto.toFixed(2) }}</p>
        </div>
      </div>
      <p class="text-xs text-gray-500">Esta sección prepara el documento asociado. Los cobros y pagos se registran en su flujo correspondiente.</p>
      <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
    </fieldset>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useEmpresaSeleccionada } from '@/modules/configuracion/empresas/composables/useEmpresaSeleccionada'
import { useEmpresaActualQuery } from '@/modules/configuracion/empresas/composables/useEmpresaActualQuery'
import { ListaIds } from '@/shared/constants/lista-ids'
import { validarTributoOrigen, type TributoOrigen } from './tributoOrigen'
const props = defineProps<{ tipo: 'percepcion' | 'retencion'; total: number; fecha: string; disabled?: boolean }>()
const model = defineModel<TributoOrigen | undefined>()
const empresaId = useEmpresaSeleccionada()
const empresa = useEmpresaActualQuery()
const titulo = computed(() => props.tipo === 'percepcion' ? 'Percepción' : 'Retención')

const percepcionQuery = useListaOpcionesQuery(ref(ListaIds.REGIMEN_PERCEPCION))
const retencionQuery = useListaOpcionesQuery(ref(ListaIds.REGIMEN_RETENCION))

const regimenes = computed(() =>
  props.tipo === 'percepcion'
    ? (percepcionQuery.data.value ?? [])
    : (retencionQuery.data.value ?? []),
)

const error = computed(() => validarTributoOrigen(model.value, props.total, props.tipo))
const monto = computed(() => Math.round(Math.round((Number(model.value?.baseImponible) || 0) * 100) * Math.round((Number(model.value?.tasa) || 0) * 100) / 10000) / 100)
const neto = computed(() => Math.round(((Number(model.value?.baseImponible) || 0) + (props.tipo === 'percepcion' ? monto.value : -monto.value)) * 100) / 100)
function toggle(on: boolean) {
  model.value = on ? { idEmpresa: empresaId.value ?? 0, serie: props.tipo === 'percepcion' ? 'P001' : 'R001', fechaEmision: props.fecha, regimen: '', tasa: 0, baseImponible: Math.round(props.total * 100) / 100 } : undefined
}
watch(empresaId, value => { if (model.value) model.value.idEmpresa = value ?? 0 })
watch(() => props.total, (value, old) => { if (model.value && model.value.baseImponible === Math.round(old * 100) / 100) model.value.baseImponible = Math.round(value * 100) / 100 })
watch(() => props.fecha, (value, old) => { if (model.value?.fechaEmision === old) model.value.fechaEmision = value })
</script>
