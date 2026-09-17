<template>
  <div>
    <PageBreadcrumb :page-title="`Nueva ${config.singular.toLowerCase()}`" :items="breadcrumbItems" />

    <div class="space-y-5">
      <!--
        El documento se arma sobre orígenes ya existentes: primero se elige la
        contraparte, luego los comprobantes (o compras) sobre los que se
        percibe/retiene. Cliente, sucursal, importes y detalle los toma el
        servidor de esos orígenes; aquí solo se elige y se revisa.
      -->
      <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">1. {{ config.contraparte }} y {{ config.origenPlural }}</h2>
        <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
          <template v-if="config.tipo === 'percepcion'">
            Solo aparecen facturas y boletas <strong>aceptadas por SUNAT</strong>, en soles y sin percepción. El comprobante de percepción se emite al cobrar.
          </template>
          <template v-else>
            Solo aparecen compras con factura de proveedor con RUC, en soles y sin retención. El comprobante de retención se emite al pagar.
          </template>
        </p>

        <div class="grid gap-4 lg:grid-cols-3">
          <div class="lg:col-span-2">
            <ClienteSelectField
              v-model="idContraparte"
              :label="config.contraparte"
              :placeholder="`Selecciona ${config.contraparte.toLowerCase()}`"
              :solo-proveedores="config.soloProveedores"
              searchable
              required
            />
          </div>
          <AppInput v-model="buscarOrigen" label="Buscar" :placeholder="`Serie-número o ${config.contraparte.toLowerCase()}`" />
        </div>

        <div class="mt-4 overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th class="w-10 px-3 py-2"></th>
                <th class="px-3 py-2 text-left">{{ config.origenSingular }}</th>
                <th class="px-3 py-2 text-left">{{ config.contraparte }}</th>
                <th class="px-3 py-2 text-left">Fecha</th>
                <th class="px-3 py-2 text-right">Total</th>
                <th class="px-3 py-2 text-left">Fecha de {{ config.operacion }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="elegiblesQuery.isLoading.value">
                <td colspan="6" class="px-3 py-6 text-center text-gray-500">Buscando {{ config.origenPlural }}...</td>
              </tr>
              <tr v-else-if="elegibles.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-gray-500">
                  No hay {{ config.origenPlural }} elegibles<span v-if="idContraparte"> para este {{ config.contraparte.toLowerCase() }}</span>.
                </td>
              </tr>
              <tr
                v-for="origen in elegibles"
                :key="origen.id"
                class="border-t border-gray-100 dark:border-gray-800"
                :class="seleccion.has(origen.id) ? 'bg-brand-50/60 dark:bg-brand-500/10' : ''"
              >
                <td class="px-3 py-2">
                  <AppCheckbox :model-value="seleccion.has(origen.id)" @update:model-value="alternar(origen, $event)" />
                </td>
                <td class="px-3 py-2">
                  <p class="font-medium text-gray-800 dark:text-white/90">{{ origen.serie }}-{{ origen.numero }}</p>
                  <p class="text-xs text-gray-500">{{ origen.nombre_tipo_comprobante ?? origen.tipo_doc }}</p>
                </td>
                <td class="px-3 py-2">
                  <p class="text-gray-800 dark:text-white/90">{{ origen[config.campos.nombreContraparte] ?? '—' }}</p>
                  <p class="text-xs text-gray-500">{{ origen[config.campos.documentoContraparte] ?? '' }}</p>
                </td>
                <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ formatFecha(origen.fecha) }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ formatMoney(origen.total) }}</td>
                <td class="px-3 py-2">
                  <AppDatePicker
                    v-if="seleccion.has(origen.id)"
                    :model-value="seleccion.get(origen.id)?.fechaOperacion ?? ''"
                    @update:model-value="setFechaOperacion(origen.id, $event)"
                  />
                  <span v-else class="text-xs text-gray-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="errorSeleccion" class="mt-2 text-xs text-error-600">{{ errorSeleccion }}</p>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">2. Datos del comprobante de {{ config.singular.toLowerCase() }}</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppInput :model-value="empresaLabel" label="Empresa emisora" disabled help="Se toma de Configuración → Empresa" />
          <AppInput v-model="form.serie" label="Serie" :placeholder="config.serieEjemplo" maxlength="4" required @input="form.serie = form.serie.toUpperCase()" />
          <AppDatePicker v-model="form.fechaEmision" label="Fecha de emisión" required />
          <AppSelect v-model="form.regimen" label="Régimen SUNAT" :options="regimenOptions" placeholder="Selecciona el régimen" required />
          <AppInput v-model.number="form.tasa" type="number" step="0.01" min="0.01" max="100" label="Tasa (%)" help="La propone el régimen; cámbiala solo si SUNAT lo indica" required />
          <div class="sm:col-span-2 lg:col-span-3">
            <AppTextarea v-model="form.observacion" label="Observaciones" :rows="2" />
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">3. Resumen</h2>
        <AppSummaryCards :cards="resumenCards" :columns="4" />
        <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Los importes se calculan por {{ config.origenSingular }} con la tasa indicada y se redondean a centavos; el servidor los recalcula al guardar.
          El documento queda <strong>pendiente de emisión</strong>: se envía a SUNAT desde su detalle.
        </p>
      </section>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
          :disabled="crearMutation.isPending.value"
          @click="router.push({ name: config.rutas.lista })"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!puedeGuardar || crearMutation.isPending.value"
          @click="onGuardar"
        >
          {{ crearMutation.isPending.value ? 'Guardando...' : `Crear ${config.singular.toLowerCase()}` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import { useEmpresaActualQuery } from '@/modules/configuracion/empresas/composables/useEmpresaActualQuery'
import { useEmpresaSeleccionada } from '@/modules/configuracion/empresas/composables/useEmpresaSeleccionada'
import { AppCheckbox, AppDatePicker, AppInput, AppSelect, AppSummaryCards, AppTextarea } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import { TRIBUTOS_CONFIG } from '../config/tributos.config'
import { useOrigenesElegiblesQuery, useTributoCatalogosQuery } from '../composables/useTributosQuery'
import { useCrearTributoMutation } from '../composables/useTributoMutations'
import type { CrearTributoPayload, OrigenElegible, OrigenesElegiblesFilters, TipoTributo } from '../interfaces/tributo.interface'
import { calcularResumen, hoyLima, validarFormularioTributo } from '../utils/calculo'
import { formatFecha, formatMoney } from '../utils/formato'

const props = defineProps<{ tipo: TipoTributo }>()
const config = computed(() => TRIBUTOS_CONFIG[props.tipo])

const router = useRouter()
const empresaSeleccionada = useEmpresaSeleccionada()
const empresaQuery = useEmpresaActualQuery()
const empresaLabel = computed(() => {
  const e = empresaQuery.data.value
  return e ? `${e.razon_social || e.nombre_comercial || 'Empresa'} · ${e.ruc}` : 'Selecciona una empresa en Configuración'
})

const breadcrumbItems = computed(() => [
  config.value.breadcrumbPadre,
  { label: config.value.plural, to: config.value.paths.lista },
  { label: 'Nueva' },
])

// ---- Orígenes (comprobantes de venta / compras) ----
const idContraparte = ref<number | ''>('')
const buscarOrigen = ref('')
const filtrosOrigen = computed<OrigenesElegiblesFilters>(() => ({
  [config.value.campos.filtroContraparte]: idContraparte.value || undefined,
  buscar: buscarOrigen.value.trim() || undefined,
  limite: 50,
}))
const elegiblesQuery = useOrigenesElegiblesQuery(props.tipo, filtrosOrigen)
const elegibles = computed(() => elegiblesQuery.data.value ?? [])

/** id de origen → origen y fecha de cobro/pago elegida. */
const seleccion = reactive(new Map<number, { origen: OrigenElegible; fechaOperacion: string }>())

function alternar(origen: OrigenElegible, marcado: boolean) {
  if (marcado) seleccion.set(origen.id, { origen, fechaOperacion: form.fechaEmision })
  else seleccion.delete(origen.id)
}
function setFechaOperacion(id: number, fecha: string) {
  const item = seleccion.get(id)
  if (item) item.fechaOperacion = fecha
}
// Cambiar de contraparte descarta lo marcado: todos los orígenes deben ser de la misma.
watch(idContraparte, () => seleccion.clear())

// ---- Cabecera ----
const form = reactive({
  serie: config.value.serieEjemplo,
  fechaEmision: hoyLima(),
  regimen: '',
  tasa: 0,
  observacion: '',
})

const catalogosQuery = useTributoCatalogosQuery(props.tipo)
const regimenes = computed(() => catalogosQuery.data.value?.[config.value.campos.catalogoRegimenes] ?? [])
const regimenOptions = computed(() =>
  regimenes.value.map((r) => ({ value: r.descripcion ?? r.nombre, label: `${r.descripcion ?? ''} · ${r.nombre}` })),
)
// Al elegir régimen se propone su tasa SUNAT; el usuario puede corregirla.
watch(() => form.regimen, (codigo) => {
  const tasa = regimenes.value.find((r) => r.descripcion === codigo)?.tasa
  if (tasa != null) form.tasa = tasa
})
watch(regimenes, (lista) => {
  if (!form.regimen && lista[0]?.descripcion) form.regimen = lista[0].descripcion
}, { immediate: true })

// ---- Resumen y validación ----
const resumen = computed(() =>
  calcularResumen(props.tipo, [...seleccion.values()].map((s) => Number(s.origen.total)), form.tasa),
)
const resumenCards = computed<SummaryCardItem[]>(() => [
  { label: `${config.value.origenPlural}`, value: String(seleccion.size), icon: ICONS.receipt },
  { label: 'Base', value: formatMoney(resumen.value.base), icon: ICONS.cashRegister },
  { label: config.value.singular, value: formatMoney(resumen.value.tributo), icon: ICONS.handCoins },
  { label: config.value.tipo === 'percepcion' ? 'Total a cobrar' : 'Neto a pagar', value: formatMoney(resumen.value.neto), icon: ICONS.wallet },
])

const errorSeleccion = computed(() =>
  validarFormularioTributo(props.tipo, {
    idEmpresa: empresaSeleccionada.value ?? null,
    serie: form.serie,
    fechaEmision: form.fechaEmision,
    regimen: form.regimen,
    tasa: form.tasa,
    origenes: [...seleccion.values()].map((s) => ({ fecha: s.origen.fecha, fechaOperacion: s.fechaOperacion })),
  }),
)
const puedeGuardar = computed(() => errorSeleccion.value === null)

const crearMutation = useCrearTributoMutation(props.tipo)

async function onGuardar() {
  if (!puedeGuardar.value || !empresaSeleccionada.value) return
  const origenes = [...seleccion.values()]
  const payload: CrearTributoPayload = {
    idEmpresa: empresaSeleccionada.value,
    serie: form.serie.trim().toUpperCase(),
    fechaEmision: form.fechaEmision,
    regimen: form.regimen,
    tasa: form.tasa,
    observacion: form.observacion.trim() || undefined,
    ...(props.tipo === 'percepcion'
      ? { comprobantes: origenes.map((s) => ({ idComprobante: s.origen.id, fechaCobro: s.fechaOperacion || undefined })) }
      : { compras: origenes.map((s) => ({ idCompra: s.origen.id, fechaPago: s.fechaOperacion || undefined })) }),
  }
  try {
    const creado = await crearMutation.mutateAsync(payload)
    await router.push({ name: config.value.rutas.detalle, params: { id: creado.id } })
  } catch {
    // toast en la mutation
  }
}
</script>
