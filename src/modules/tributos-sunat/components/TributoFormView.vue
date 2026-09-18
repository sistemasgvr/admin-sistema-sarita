<template>
  <div>
    <PageBreadcrumb :page-title="`Nueva ${config.singular.toLowerCase()}`" :items="breadcrumbItems" />

    <div class="space-y-5">
      <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">1. {{ config.contraparte }} y {{ config.origenPlural }}</h2>
        <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
          <template v-if="config.tipo === 'percepcion'">
            Solo aparecen facturas y boletas en soles, sin percepción y no rechazadas por SUNAT. Un comprobante <strong>pendiente de envío</strong> se puede agregar, pero la percepción no se podrá emitir hasta que SUNAT lo acepte.
          </template>
          <template v-else>
            Solo aparecen compras con factura de proveedor con RUC, en soles y sin retención. El comprobante de retención se emite al pagar.
          </template>
        </p>

        <div class="grid gap-4 lg:grid-cols-2">
          <ClienteSelectField
            v-model="idContraparte"
            :label="config.contraparte"
            :placeholder="`Todos los ${config.contraparte.toLowerCase()}s`"
            :solo-proveedores="config.soloProveedores"
            searchable
            :help="`Acota la búsqueda. Si no eliges ${config.contraparte.toLowerCase()}, se toma el del primer ${config.origenSingular} que agregues.`"
          />
          <AppSelectSearch
            v-model="origenAAgregar"
            v-model:search="buscarOrigen"
            remote
            :clearable="false"
            :label="`Agregar ${config.origenSingular}`"
            :placeholder="`Busca y agrega un ${config.origenSingular}`"
            :search-placeholder="`Serie-número, ${config.contraparte.toLowerCase()} o documento...`"
            :options="opcionesOrigen"
            :loading="elegiblesQuery.isFetching.value"
            :empty-text="textoSinResultados"
            :help="ayudaBusqueda"
          />
        </div>

        <div class="mt-4 flex items-center justify-between gap-3">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ config.origenPlural }} agregados
            <span class="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
              {{ seleccion.size }}
            </span>
          </h3>
          <button
            v-if="seleccion.size > 0"
            type="button"
            class="text-xs font-medium text-gray-500 hover:text-error-600 dark:text-gray-400"
            @click="seleccion.clear()"
          >
            Quitar todos
          </button>
        </div>

        <div class="mt-2 overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th class="px-3 py-2 text-left">{{ config.origenSingular }}</th>
                <th class="px-3 py-2 text-left">{{ config.contraparte }}</th>
                <th class="px-3 py-2 text-left">Fecha</th>
                <th class="px-3 py-2 text-right">Total</th>
                <th class="px-3 py-2 text-right">{{ config.singular }}</th>
                <th class="px-3 py-2 text-left">Fecha de {{ config.operacion }}</th>
                <th class="w-10 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="seleccionados.length === 0">
                <td colspan="7" class="px-3 py-8 text-center">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Todavía no agregaste ningún {{ config.origenSingular }}.
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Búscalo arriba por serie-número (P. ej. {{ config.tipo === 'percepcion' ? 'F001-123' : 'E001-55' }}),
                    por {{ config.contraparte.toLowerCase() }} o por su número de documento.
                  </p>
                </td>
              </tr>
              <tr
                v-for="item in seleccionados"
                :key="item.origen.id"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="px-3 py-2">
                  <p class="font-medium text-gray-800 dark:text-white/90">{{ item.origen.serie }}-{{ item.origen.numero }}</p>
                  <p class="flex items-center gap-1.5 text-xs text-gray-500">
                    {{ item.origen.nombre_tipo_comprobante ?? item.origen.tipo_doc }}
                    <AppBadge v-if="estadoSunatBadge(item.origen)" :color="estadoSunatBadge(item.origen)!.color" size="sm">
                      {{ estadoSunatBadge(item.origen)!.label }}
                    </AppBadge>
                  </p>
                </td>
                <td class="px-3 py-2">
                  <p class="text-gray-800 dark:text-white/90">{{ item.origen[config.campos.nombreContraparte] ?? '—' }}</p>
                  <p class="text-xs text-gray-500">{{ item.origen[config.campos.documentoContraparte] ?? '' }}</p>
                </td>
                <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ formatFecha(item.origen.fecha) }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ formatMoney(item.origen.total) }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-brand-600 dark:text-brand-400">
                  {{ formatMoney(tributoDeLinea(item.origen)) }}
                </td>
                <td class="px-3 py-2">
                  <AppDatePicker
                    :model-value="item.fechaOperacion"
                    @update:model-value="setFechaOperacion(item.origen.id, $event)"
                  />
                </td>
                <td class="px-3 py-2 text-right">
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
                    :title="`Quitar ${item.origen.serie}-${item.origen.numero}`"
                    @click="seleccion.delete(item.origen.id)"
                  >
                    <AppIcon :name="ICONS.trash" :size="16" />
                  </button>
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
          <AppSelect
            v-model="serieSeleccionada"
            label="Serie"
            :options="serieOptions"
            :placeholder="seriesQuery.isLoading.value ? 'Cargando...' : 'Selecciona la serie'"
            :disabled="seriesQuery.isLoading.value || !empresaSeleccionada"
            :hint="serieHint"
            required
          />
          <AppInput
            v-if="serieSeleccionada === NUEVA_SERIE"
            v-model="serieNueva"
            :label="`Nueva serie (${config.seriePrefijo}001–${config.seriePrefijo}999)`"
            :placeholder="config.serieEjemplo"
            maxlength="4"
            required
            :sanitize="(valor: string) => valor.toUpperCase()"
          />
          <AppDatePicker v-model="form.fechaEmision" label="Fecha de emisión" required />
          <AppSelect v-model="form.regimen" label="Régimen SUNAT" :options="regimenOptions" placeholder="Selecciona el régimen" required />
          <AppSelect
            v-model="form.tasa"
            label="Tasa"
            :options="tasaOptions"
            :placeholder="form.regimen ? 'Selecciona la tasa' : 'Elige primero el régimen'"
            :disabled="tasaOptions.length === 0"
            :help="ayudaTasa"
            required
          />
          <div class="sm:col-span-2 lg:col-span-4">
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
import { AppBadge, AppDatePicker, AppInput, AppSelect, AppSelectSearch, AppSummaryCards, AppTextarea } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import type { SelectOption, SelectOptionBadge } from '@/shared/interfaces/form.interface'
import { TRIBUTOS_CONFIG } from '../config/tributos.config'
import {
  useOrigenesElegiblesQuery,
  useSeriesTributoQuery,
  useTributoCatalogosQuery,
} from '../composables/useTributosQuery'
import { useCrearTributoMutation } from '../composables/useTributoMutations'
import type { CrearTributoPayload, OrigenElegible, OrigenesElegiblesFilters, TipoTributo } from '../interfaces/tributo.interface'
import { calcularResumen, hoyLima, redondear2, validarFormularioTributo } from '../utils/calculo'
import { formatFecha, formatMoney } from '../utils/formato'

const props = defineProps<{ tipo: TipoTributo }>()
const config = computed(() => TRIBUTOS_CONFIG[props.tipo])

const router = useRouter()
const empresaSeleccionada = useEmpresaSeleccionada()
const idEmpresa = computed(() => empresaSeleccionada.value ?? null)
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

const idContraparte = ref<number | ''>('')
const buscarOrigen = ref('')
const origenAAgregar = ref<string | number | null>('')

const filtrosOrigen = computed<OrigenesElegiblesFilters>(() => ({
  [config.value.campos.filtroContraparte]: idContraparte.value || undefined,
  buscar: buscarOrigen.value.trim() || undefined,
  limite: 50,
}))
const elegiblesQuery = useOrigenesElegiblesQuery(props.tipo, filtrosOrigen)
const elegibles = computed(() => elegiblesQuery.data.value ?? [])

const seleccion = reactive(new Map<number, { origen: OrigenElegible; fechaOperacion: string }>())
const seleccionados = computed(() => [...seleccion.values()])

const opcionesOrigen = computed<SelectOption[]>(() =>
  elegibles.value
    .filter((origen) => !seleccion.has(origen.id))
    .map((origen) => ({
      value: origen.id,
      title: `${origen.serie}-${origen.numero}`,
      label: `${origen[config.value.campos.nombreContraparte] ?? ''} ${origen[config.value.campos.documentoContraparte] ?? ''}`.trim(),
      badges: [
        { label: origen[config.value.campos.nombreContraparte] ?? 'Sin nombre' },
        { label: formatMoney(origen.total), color: 'success' as const },
        { label: formatFecha(origen.fecha) },
        ...(estadoSunatBadge(origen) ? [estadoSunatBadge(origen)!] : []),
      ],
    })),
)


function estadoSunatBadge(origen: OrigenElegible): SelectOptionBadge | null {
  if (config.value.tipo !== 'percepcion') return null
  const estado = origen.nombre_estado_sunat ?? 'PENDIENTE'
  return { label: estado === 'ACEPTADO' ? 'Aceptado SUNAT' : 'Pendiente SUNAT', color: estado === 'ACEPTADO' ? 'primary' : 'warning' }
}

const textoSinResultados = computed(() => {
  if (elegiblesQuery.isFetching.value) return 'Buscando...'
  if (buscarOrigen.value.trim()) return `Ningún ${config.value.origenSingular} coincide con «${buscarOrigen.value.trim()}»`
  return `No hay ${config.value.origenPlural} elegibles${idContraparte.value ? ` para este ${config.value.contraparte.toLowerCase()}` : ''}`
})

const ayudaBusqueda = computed(() => {
  const disponibles = opcionesOrigen.value.length
  if (disponibles === 0) return textoSinResultados.value
  const sufijo = buscarOrigen.value.trim() ? 'coinciden con la búsqueda' : 'disponibles'
  return `${disponibles} ${disponibles === 1 ? config.value.origenSingular : config.value.origenPlural} ${sufijo}`
})

watch(origenAAgregar, (id) => {
  if (id === '' || id === null) return
  const origen = elegibles.value.find((o) => o.id === Number(id))
  if (origen) agregar(origen)
  origenAAgregar.value = ''
})

function agregar(origen: OrigenElegible) {
  seleccion.set(origen.id, { origen, fechaOperacion: form.fechaEmision })
  const idOrigen = origen[config.value.campos.idContraparte]
  if (!idContraparte.value && idOrigen) idContraparte.value = idOrigen
}

function setFechaOperacion(id: number, fecha: string) {
  const item = seleccion.get(id)
  if (item) item.fechaOperacion = fecha
}

function tributoDeLinea(origen: OrigenElegible): number {
  return redondear2((redondear2(Number(origen.total) || 0) * (Number(form.tasa) || 0)) / 100)
}

watch(idContraparte, (id) => {
  if (!id) return
  for (const [key, item] of seleccion) {
    if (item.origen[config.value.campos.idContraparte] !== id) seleccion.delete(key)
  }
})

const form = reactive({
  fechaEmision: hoyLima(),
  regimen: '',
  tasa: '' as number | '',
  observacion: '',
})


const NUEVA_SERIE = '__nueva__'
const serieSeleccionada = ref<string>('')
const serieNueva = ref('')

const seriesQuery = useSeriesTributoQuery(props.tipo, idEmpresa)
const series = computed(() => seriesQuery.data.value?.series ?? [])
const serieOptions = computed<SelectOption[]>(() => [
  ...series.value.map((s) => ({ value: s.serie, label: `${s.serie} · siguiente ${s.siguiente_numero}` })),
  { value: NUEVA_SERIE, label: 'Otra serie...' },
])
const serie = computed(() =>
  serieSeleccionada.value === NUEVA_SERIE ? serieNueva.value.trim().toUpperCase() : serieSeleccionada.value,
)
const serieHint = computed(() => {
  if (serieSeleccionada.value === NUEVA_SERIE) return 'Empezará en 00000001'
  const elegida = series.value.find((s) => s.serie === serieSeleccionada.value)
  return elegida ? `Se emitirá ${elegida.serie}-${elegida.siguiente_numero}` : undefined
})

watch(series, (lista) => {
  if (!serieSeleccionada.value && lista[0]) serieSeleccionada.value = lista[0].serie
}, { immediate: true })

const catalogosQuery = useTributoCatalogosQuery(props.tipo)
const regimenes = computed(() => catalogosQuery.data.value?.[config.value.campos.catalogoRegimenes] ?? [])
const regimenOptions = computed<SelectOption[]>(() =>
  regimenes.value.map((r) => ({ value: r.descripcion ?? r.nombre, label: `${r.descripcion ?? ''} · ${r.nombre}` })),
)
const regimenActual = computed(() => regimenes.value.find((r) => r.descripcion === form.regimen))
const tasaOptions = computed<SelectOption[]>(() =>
  (regimenActual.value?.tasas ?? []).map((t) => ({ value: t.tasa, label: t.etiqueta })),
)
const ayudaTasa = computed(() => {
  if (!form.regimen) return undefined
  if (tasaOptions.value.length === 0) return 'Este régimen no tiene tasas registradas en el catálogo'
  return tasaOptions.value.length > 1 ? 'El régimen admite más de una tasa' : undefined
})

watch(() => form.regimen, () => {
  const tasas = regimenActual.value?.tasas ?? []
  form.tasa = tasas.length > 0 ? tasas[0].tasa : ''
})
watch(regimenes, (lista) => {
  if (!form.regimen && lista[0]?.descripcion) form.regimen = lista[0].descripcion
}, { immediate: true })

const resumen = computed(() =>
  calcularResumen(props.tipo, seleccionados.value.map((s) => Number(s.origen.total)), Number(form.tasa) || 0),
)
const resumenCards = computed<SummaryCardItem[]>(() => [
  { label: `${config.value.origenPlural}`, value: String(seleccion.size), icon: ICONS.receipt },
  { label: 'Base', value: formatMoney(resumen.value.base), icon: ICONS.cashRegister },
  { label: config.value.singular, value: formatMoney(resumen.value.tributo), icon: ICONS.handCoins },
  { label: config.value.tipo === 'percepcion' ? 'Total a cobrar' : 'Neto a pagar', value: formatMoney(resumen.value.neto), icon: ICONS.wallet },
])

const errorSeleccion = computed(() =>
  validarFormularioTributo(props.tipo, {
    idEmpresa: idEmpresa.value,
    serie: serie.value,
    fechaEmision: form.fechaEmision,
    regimen: form.regimen,
    tasa: Number(form.tasa) || 0,
    origenes: seleccionados.value.map((s) => ({ fecha: s.origen.fecha, fechaOperacion: s.fechaOperacion })),
  }),
)
const puedeGuardar = computed(() => errorSeleccion.value === null)

const crearMutation = useCrearTributoMutation(props.tipo)

async function onGuardar() {
  if (!puedeGuardar.value || !empresaSeleccionada.value) return
  const origenes = seleccionados.value
  const payload: CrearTributoPayload = {
    idEmpresa: empresaSeleccionada.value,
    serie: serie.value,
    fechaEmision: form.fechaEmision,
    regimen: form.regimen,
    tasa: Number(form.tasa),
    observacion: form.observacion.trim() || undefined,
    ...(props.tipo === 'percepcion'
      ? { comprobantes: origenes.map((s) => ({ idComprobante: s.origen.id, fechaCobro: s.fechaOperacion || undefined })) }
      : { compras: origenes.map((s) => ({ idCompra: s.origen.id, fechaPago: s.fechaOperacion || undefined })) }),
  }
  try {
    const creado = await crearMutation.mutateAsync(payload)
    await router.push({ name: config.value.rutas.detalle, params: { id: creado.id } })
  } catch {
  }
}
</script>
