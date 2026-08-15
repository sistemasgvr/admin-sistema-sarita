<template>
  <AppModal
    v-model="open"
    title="Programar recojo"
    subtitle="Envases en préstamo o accesorios en alquiler"
    size="lg"
  >
    <template #header>
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
        >
          <AppIcon :name="ICONS.truck" :size="18" />
        </span>
        <div class="min-w-0">
          <h4 class="text-base font-semibold leading-snug text-gray-800 dark:text-white/90 sm:text-lg">
            Programar recojo
          </h4>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Envases en préstamo o accesorios en alquiler.
          </p>
        </div>
      </div>
    </template>
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppSelectSearch
          v-model="clienteId"
          v-model:search="clienteBuscar"
          label="Cliente"
          placeholder="Selecciona cliente"
          search-placeholder="Nombre o documento..."
          empty-text="No hay clientes"
          required
          remote
          :options="clienteOptions"
          :loading="clientesQuery.isFetching.value"
          :disabled="Boolean(props.idCliente)"
        />
        <AppSelect
          v-model="origenTipo"
          label="Tipo"
          :options="tipoOrigenOptions"
          :disabled="Boolean(props.tipoOrigen)"
        />
        <AppSelect
          v-model="prestamoId"
          v-if="origenTipo === 'PRESTAMO'"
          label="Préstamo"
          placeholder="Selecciona préstamo activo"
          empty-text="No hay préstamos activos para este cliente"
          required
          :options="prestamoOptions"
          :disabled="!clienteId || Boolean(props.idPrestamo)"
        />
        <AppSelect
          v-else
          v-model="alquilerId"
          label="Alquiler"
          placeholder="Selecciona alquiler activo"
          empty-text="No hay alquileres activos para este cliente"
          required
          :options="alquilerOptions"
          :disabled="!clienteId || Boolean(props.idAlquiler)"
        />
        <AppInput v-model="fechaProgramada" label="Fecha programada" type="date" required />
        <AppInput
          v-model="horaEstimada"
          label="Hora estimada"
          type="time"
          hint="Opcional"
        />
      </div>

      <AppInput
        v-model="observacion"
        label="Observación"
        placeholder="Indicaciones de visita, dirección, etc."
      />

      <div>
        <p class="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-white/90">
          <AppIcon :name="ICONS.cylinder" :size="16" class="text-gray-500 dark:text-gray-400" />
          Ítems a recoger
        </p>
        <p
          v-if="!idOrigen"
          class="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          Selecciona un préstamo o alquiler para listar pendientes.
        </p>
        <p
          v-else-if="cargandoItems"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          Cargando...
        </p>
        <ul v-else-if="pendientes.length > 0 || mostrarAccesorio" class="space-y-2">
          <li
            v-if="mostrarAccesorio"
            class="flex items-start gap-3 rounded-xl border border-gray-200 px-3 py-2.5 dark:border-gray-700"
          >
            <input
              id="recojo-det-regulador"
              v-model="incluirRegulador"
              type="checkbox"
              class="mt-1"
            />
            <label for="recojo-det-regulador" class="min-w-0 flex-1 cursor-pointer">
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ etiquetaRegulador }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Accesorio de alquiler
                <template v-if="alquilerSeleccionado?.fecha_fin_pactada">
                  · Retorno {{ alquilerSeleccionado.fecha_fin_pactada.slice(0, 10) }}
                </template>
              </p>
            </label>
          </li>
          <li
            v-for="detalle in pendientes"
            :key="detalle.id"
            class="flex items-start gap-3 rounded-xl border border-gray-200 px-3 py-2.5 dark:border-gray-700"
          >
            <input
              :id="`recojo-det-${detalle.id}`"
              v-model="idsSeleccionados"
              type="checkbox"
              class="mt-1"
              :value="detalle.id"
            />
            <label :for="`recojo-det-${detalle.id}`" class="min-w-0 flex-1 cursor-pointer">
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ detalle.codigo_balon || `Cilindro #${detalle.id_balon || detalle.id}` }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ ('nombre_producto' in detalle ? detalle.nombre_producto : null) || '—' }}
                <template v-if="fechaRetorno(detalle)">
                  · Retorno {{ fechaRetorno(detalle)?.slice(0, 10) }}
                </template>
              </p>
            </label>
          </li>
        </ul>
        <p
          v-else
          class="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          No hay ítems pendientes de devolución en este registro.
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="createMutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="createMutation.isPending.value || !puedeGuardar"
        @click="confirmar"
      >
        {{ createMutation.isPending.value ? 'Guardando...' : 'Programar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCreateRecojoMutation } from '@/modules/balones/recojos/composables/useRecojoMutations'
import { usePrestamosQuery } from '@/modules/balones/prestamos/composables/usePrestamosQuery'
import { usePrestamosDetalleQuery } from '@/modules/balones/prestamos/composables/usePrestamosDetalleQuery'
import type { PrestamoDetalleListFilters } from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'
import {
  useAlquilerQuery,
  useAlquileresQuery,
} from '@/modules/balones/alquileres/composables/useAlquileresQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { hoyIsoLima } from '@/shared/utils/date'

const props = defineProps<{
  idCliente?: number | null
  idPrestamo?: number | null
  idAlquiler?: number | null
  tipoOrigen?: 'PRESTAMO' | 'ALQUILER' | null
  /** Etiqueta del préstamo/alquiler prefijado (p. ej. desde pendientes) */
  numeroOrigen?: string | null
  idDetalle?: number | null
  tipoItem?: 'CILINDRO' | 'REGULADOR' | string | null
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const createMutation = useCreateRecojoMutation()

const clienteId = ref<number | ''>('')
const prestamoId = ref<number | ''>('')
const alquilerId = ref<number | ''>('')
const origenTipo = ref<'PRESTAMO' | 'ALQUILER'>('PRESTAMO')
const fechaProgramada = ref(hoyIsoLima())
const horaEstimada = ref('')
const observacion = ref('')
const idsSeleccionados = ref<number[]>([])
const incluirRegulador = ref(false)
const clienteBuscar = ref('')

const clientesFilters = ref({
  pagina: 1,
  limite: 50,
  soloActivos: 1 as number,
  buscar: undefined as string | undefined,
})
const clientesQuery = useClientesQuery(clientesFilters)

const prestamosFilters = ref({
  pagina: 1,
  limite: 50,
  idCliente: undefined as number | undefined,
})
const prestamosQuery = usePrestamosQuery(prestamosFilters)
const alquileresFilters = ref({ pagina: 1, limite: 50, idCliente: undefined as number | undefined })
const alquileresQuery = useAlquileresQuery(alquileresFilters)

const detallesFilters = ref<PrestamoDetalleListFilters>({
  pagina: 1,
  limite: 100,
  idPrestamo: undefined,
})
const detallesQuery = usePrestamosDetalleQuery(detallesFilters)
const alquilerIdRef = computed(() =>
  origenTipo.value === 'ALQUILER' && alquilerId.value ? Number(alquilerId.value) : null,
)
const alquilerQuery = useAlquilerQuery(alquilerIdRef)
const alquilerSeleccionado = computed(() => alquilerQuery.data.value ?? null)

const clienteOptions = computed(() =>
  (clientesQuery.data.value?.data ?? []).map((c) => ({
    value: c.id,
    label: getClienteOptionLabel(c),
  })),
)

const prestamoOptions = computed(() => {
  const fromList = (prestamosQuery.data.value?.data ?? [])
    .filter((p) => (p.nombre_estado ?? '').toUpperCase() === 'ACTIVO')
    .map((p) => ({
      value: p.id,
      label: [p.numero_prestamo, p.titulo].filter(Boolean).join(' — ') || `#${p.id}`,
    }))
  const prefijado = props.idPrestamo ? Number(props.idPrestamo) : null
  if (prefijado && !fromList.some((o) => Number(o.value) === prefijado)) {
    fromList.unshift({
      value: prefijado,
      label: props.numeroOrigen?.trim() || `Préstamo #${prefijado}`,
    })
  }
  return fromList
})
const alquilerOptions = computed(() => {
  const fromList = (alquileresQuery.data.value?.data ?? [])
    .filter((a) => (a.nombre_estado ?? '').toUpperCase() === 'ACTIVO')
    .map((a) => ({ value: a.id, label: a.numero_alquiler || `#${a.id}` }))
  const prefijado = props.idAlquiler ? Number(props.idAlquiler) : null
  if (prefijado && !fromList.some((o) => Number(o.value) === prefijado)) {
    fromList.unshift({
      value: prefijado,
      label: props.numeroOrigen?.trim() || `Alquiler #${prefijado}`,
    })
  }
  return fromList
})

const pendientes = computed(() =>
  origenTipo.value === 'PRESTAMO'
    ? (detallesQuery.data.value?.data ?? []).filter((d) => !d.fecha_devolucion)
    : [],
)
const idOrigen = computed(() => origenTipo.value === 'PRESTAMO' ? prestamoId.value : alquilerId.value)
const tipoOrigenOptions = [{ value: 'PRESTAMO', label: 'Préstamo' }, { value: 'ALQUILER', label: 'Alquiler' }]
const cargandoItems = computed(
  () =>
    (origenTipo.value === 'PRESTAMO' && detallesQuery.isFetching.value) ||
    (origenTipo.value === 'ALQUILER' && alquilerQuery.isFetching.value),
)
const mostrarAccesorio = computed(() => {
  if (origenTipo.value !== 'ALQUILER' || !alquilerId.value) return false
  if (cargandoItems.value) return false
  const alq = alquilerSeleccionado.value
  return Boolean(alq?.id_producto_regulador || alq?.id_producto_stock)
})
const etiquetaRegulador = computed(() => {
  const alq = alquilerSeleccionado.value
  if (!alq) return 'Regulador / accesorio'
  const codigo = alq.codigo_producto_regulador || alq.codigo_producto_stock
  const nombre = alq.nombre_producto_regulador || alq.nombre_producto_stock
  return [codigo, nombre].filter(Boolean).join(' — ') || 'Regulador / accesorio'
})

const puedeGuardar = computed(
  () =>
    Boolean(clienteId.value) &&
    Boolean(idOrigen.value) &&
    Boolean(fechaProgramada.value) &&
    (idsSeleccionados.value.length > 0 || (mostrarAccesorio.value && incluirRegulador.value)),
)

watch(clienteBuscar, (term) => {
  clientesFilters.value = {
    ...clientesFilters.value,
    buscar: term.trim() || undefined,
  }
})

watch(clienteId, (value) => {
  prestamosFilters.value = {
    ...prestamosFilters.value,
    idCliente: value ? Number(value) : undefined,
  }
  alquileresFilters.value = {
    ...alquileresFilters.value,
    idCliente: value ? Number(value) : undefined,
  }
  if (!props.idPrestamo) {
    prestamoId.value = ''
  }
  if (!props.idAlquiler) {
    alquilerId.value = ''
  }
})

watch(prestamoId, (value) => {
  detallesFilters.value = {
    ...detallesFilters.value,
    idPrestamo: value ? Number(value) : undefined,
  }
  idsSeleccionados.value = []
})
watch(alquilerId, () => {
  idsSeleccionados.value = []
  if (!prefillAccesorio()) incluirRegulador.value = false
})
watch(origenTipo, () => {
  idsSeleccionados.value = []
  if (!prefillAccesorio()) incluirRegulador.value = false
})

watch([pendientes, () => open.value], () => {
  if (!open.value || idsSeleccionados.value.length > 0) return
  const prefijado = Number(props.idDetalle ?? 0)
  if (prefijado > 0 && pendientes.value.some((d) => d.id === prefijado)) {
    idsSeleccionados.value = [prefijado]
  }
})

watch(
  () =>
    [open.value, props.idCliente, props.idPrestamo, props.idAlquiler, props.idDetalle, props.tipoItem] as const,
  ([isOpen]) => {
    if (!isOpen) return
    clienteId.value = props.idCliente ?? ''
    origenTipo.value = props.tipoOrigen ?? (props.idAlquiler ? 'ALQUILER' : 'PRESTAMO')
    prestamoId.value = props.idPrestamo ?? ''
    alquilerId.value = props.idAlquiler ?? ''
    fechaProgramada.value = hoyIsoLima()
    horaEstimada.value = ''
    observacion.value = ''
    idsSeleccionados.value = []
    incluirRegulador.value = prefillAccesorio()
    if (props.idCliente) {
      const idClientePrefijo = Number(props.idCliente)
      prestamosFilters.value = {
        ...prestamosFilters.value,
        idCliente: idClientePrefijo,
      }
      alquileresFilters.value = {
        ...alquileresFilters.value,
        idCliente: idClientePrefijo,
      }
    }
    if (props.idPrestamo) {
      detallesFilters.value = {
        ...detallesFilters.value,
        idPrestamo: Number(props.idPrestamo),
      }
    }
  },
)

function prefillAccesorio() {
  if (props.tipoItem === 'REGULADOR') return true
  if (props.idAlquiler && props.idDetalle === 0) return true
  return false
}

async function confirmar() {
  const userId = authStore.user?.id
  if (!userId || !puedeGuardar.value) {
    toastWarning('Completa cliente, tipo, registro, fecha y al menos un ítem')
    return
  }

  try {
    await createMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      idCliente: Number(clienteId.value),
      idPrestamo: origenTipo.value === 'PRESTAMO' ? Number(prestamoId.value) : undefined,
      idAlquiler: origenTipo.value === 'ALQUILER' ? Number(alquilerId.value) : undefined,
      fechaProgramada: fechaProgramada.value,
      horaEstimada: horaEstimada.value
        ? horaEstimada.value.length === 5
          ? `${horaEstimada.value}:00`
          : horaEstimada.value.slice(0, 8)
        : undefined,
      observacion: observacion.value.trim() || undefined,
      detalles:
        origenTipo.value === 'ALQUILER'
          ? []
          : idsSeleccionados.value.map((id) => ({ idPrestamoDetalle: id })),
    })
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation
  }
}

function fechaRetorno(detalle: { fecha_vencimiento?: string | null; fecha_fin_pactada?: string | null }) {
  return detalle.fecha_vencimiento ?? detalle.fecha_fin_pactada
}
</script>
