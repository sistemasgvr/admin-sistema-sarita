<template>
  <div class="space-y-6">
    <PageBreadcrumb page-title="Nueva percepción" :items="breadcrumb" />

    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Nueva Percepción</h1>
    </div>

    <form class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]" @submit.prevent="onCrear">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="sm:col-span-2 lg:col-span-3">
          <ClienteSelectField
            v-model="form.idCliente"
            label="Cliente"
            searchable
            required
          />
        </div>
        <AppInput v-model="form.serie" label="Serie (ej: P001)" required />
        <AppInput v-model="form.fechaEmision" type="date" label="Fecha de emisión" required />
        <AppSelect
          v-model="form.regimen"
          label="Régimen"
          :options="regimenesOptions"
          required
          @update:model-value="onRegimenChange"
        />

        <AppInput v-model.number="form.tasa" type="number" label="Tasa (%)" step="0.01" required />
        <AppInput v-model.number="form.baseImponible" type="number" label="Base imponible" step="0.01" required />
        <AppInput v-model.number="form.montoPercibido" type="number" label="Monto percibido" step="0.01" required />
        <AppInput v-model.number="form.montoCobrado" type="number" label="Monto cobrado" step="0.01" required />

        <div class="sm:col-span-2 lg:col-span-3">
          <AppTextarea v-model="form.observacion" label="Observaciones" :rows="2" />
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          @click="router.back()"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="creando"
          class="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-70"
        >
          {{ creando ? 'Creando...' : 'Crear percepción' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { percepcionesService } from '../services/percepciones.service'
import { TASAS_PERCEPCION } from '../constants/regimenes'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useEmpresaSeleccionada } from '@/modules/configuracion/empresas/composables/useEmpresaSeleccionada'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import { AppInput, AppSelect, AppTextarea } from '@/shared/components'
import { ListaIds } from '@/shared/constants/lista-ids'
import { toastSuccess, toastApiError } from '@/shared/composables/useToast'

const router = useRouter()
const empresaSeleccionada = useEmpresaSeleccionada()

const breadcrumb = [
  { label: 'Inicio', to: '/' },
  { label: 'Ventas', to: '/ventas' },
  { label: 'Percepciones', to: '/ventas/percepciones' },
  { label: 'Nueva' },
]

const creando = ref(false)

const regimenesQuery = useListaOpcionesQuery(ref(ListaIds.REGIMEN_PERCEPCION))

const regimenesOptions = computed(() =>
  (regimenesQuery.data.value ?? []).map((o) => ({
    value: o.descripcion ?? '',
    label: `${o.descripcion ?? ''} - ${o.nombre}`,
  })),
)

const form = ref({
  idCliente: '' as number | '',
  serie: 'P001',
  fechaEmision: new Date().toISOString().slice(0, 10),
  regimen: '01',
  tasa: 2,
  baseImponible: 0,
  montoPercibido: 0,
  montoCobrado: 0,
  observacion: '',
})

function onRegimenChange(codigo: string) {
  form.value.tasa = TASAS_PERCEPCION[codigo] ?? 0
}

async function onCrear() {
  if (!form.value.idCliente) {
    toastApiError(new Error('Selecciona el cliente'))
    return
  }
  creando.value = true
  try {
    const resp = await percepcionesService.crear({
      ...form.value,
      idCliente: Number(form.value.idCliente),
      idEmpresa: empresaSeleccionada.value ?? 0,
    })
    toastSuccess(`Percepción ${resp.serie}-${resp.numero} creada`)
    router.push({ name: 'admin-percepciones-detalle', params: { id: resp.id } })
  } catch (error) {
    toastApiError(error)
  } finally {
    creando.value = false
  }
}
</script>
