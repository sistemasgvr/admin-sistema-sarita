<template>
  <div class="space-y-6">
    <PageBreadcrumb page-title="Nueva retención" :items="breadcrumb" />

    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Nueva Retención</h1>
    </div>

    <form class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]" @submit.prevent="onCrear">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="sm:col-span-2 lg:col-span-3">
          <ClienteSelectField
            v-model="form.idProveedor"
            label="Proveedor"
            searchable
            solo-proveedores
            required
          />
        </div>
        <AppInput v-model="form.serie" label="Serie (ej: R001)" required />
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
        <AppInput v-model.number="form.montoRetenido" type="number" label="Monto retenido" step="0.01" required />
        <AppInput v-model.number="form.montoPagado" type="number" label="Monto pagado" step="0.01" required />

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
          {{ creando ? 'Creando...' : 'Crear retención' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { retencionesService } from '../services/retenciones.service'
import { TASAS_RETENCION } from '../constants/regimenes'
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
  { label: 'Compras', to: '/compras' },
  { label: 'Retenciones', to: '/compras/retenciones' },
  { label: 'Nueva' },
]

const creando = ref(false)

const regimenesQuery = useListaOpcionesQuery(ref(ListaIds.REGIMEN_RETENCION))

const regimenesOptions = computed(() =>
  (regimenesQuery.data.value ?? []).map((o) => ({
    value: o.descripcion ?? '',
    label: `${o.descripcion ?? ''} - ${o.nombre}`,
  })),
)

const form = ref({
  idProveedor: '' as number | '',
  serie: 'R001',
  fechaEmision: new Date().toISOString().slice(0, 10),
  regimen: '01',
  tasa: 3,
  baseImponible: 0,
  montoRetenido: 0,
  montoPagado: 0,
  observacion: '',
})

function onRegimenChange(codigo: string) {
  form.value.tasa = TASAS_RETENCION[codigo] ?? 0
}

async function onCrear() {
  if (!form.value.idProveedor) {
    toastApiError(new Error('Selecciona el proveedor'))
    return
  }
  creando.value = true
  try {
    const resp = await retencionesService.crear({
      ...form.value,
      idProveedor: Number(form.value.idProveedor),
      idEmpresa: empresaSeleccionada.value ?? 0,
    })
    toastSuccess(`Retención ${resp.serie}-${resp.numero} creada`)
    router.push({ name: 'admin-retenciones-detalle', params: { id: resp.id } })
  } catch (error) {
    toastApiError(error)
  } finally {
    creando.value = false
  }
}
</script>
