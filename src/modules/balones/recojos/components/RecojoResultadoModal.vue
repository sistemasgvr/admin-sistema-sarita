<template>
  <AppModal
    v-model="open"
    title="Registrar resultado de visita"
    :subtitle="recojoLabel"
    size="xl"
  >
    <div v-if="recojoQuery.isFetching.value" class="py-8 text-center text-sm text-gray-500">
      Cargando recojo...
    </div>
    <div v-else-if="recojo" class="space-y-4">
      <div
        v-if="puedeIniciarRuta"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-3 py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Ruta al cliente</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ recojo.direccion || 'Dirección principal con coordenadas' }}
          </p>
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="iniciarRuta"
        >
          <AppIcon :name="ICONS.mapPin" :size="15" />
          Iniciar ruta
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="fechaVisita" label="Fecha de visita" type="date" required />
        <AppSelect
          v-model="motivoFalloNombre"
          label="Motivo (si falla / no recoge)"
          placeholder="Selecciona motivo"
          :options="motivoOptions"
          hint="Obligatorio si todos quedan como No recogido"
        />
      </div>
      <AppInput v-model="observacion" label="Observación de la visita" />

      <label
        v-if="puedeOptarAccesorio"
        class="flex items-center gap-2 text-sm text-gray-800 dark:text-white/90"
      >
        <input v-model="incluirAccesorio" type="checkbox" class="rounded" />
        Recoger accesorio
      </label>

      <div v-if="mostrarAccesorio" class="space-y-3">
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">Accesorio</p>
        <div class="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ etiquetaRegulador }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ recojo.numero_alquiler || (recojo.id_alquiler ? `#${recojo.id_alquiler}` : 'Alquiler') }}
              </p>
            </div>
            <AppSelect
              v-model="resultadoRegulador"
              label="Resultado"
              :options="resultadoOptions"
              :disabled="accesorioResuelto"
              class="min-w-[180px]"
            />
          </div>
          <div
            v-if="resultadoRegulador === 'RECOGIDO'"
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div>
              <div class="mb-1.5 flex items-center gap-1.5">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado del regulador
                  <span class="text-error-500" aria-hidden="true">*</span>
                </label>
                <AppHelpTip
                  text="Bueno / reingresa a stock. Para reparar / pasa a mantenimiento."
                />
              </div>
              <AppSelect
                v-model="condicionRegulador"
                :options="condicionOptions"
                required
                :disabled="accesorioResuelto"
              />
            </div>
            <AppInput
              v-model="observacionRegulador"
              label="Observación"
              placeholder="Daño, fuga, pieza faltante, etc."
              :disabled="accesorioResuelto"
            />
          </div>
          <AppInput
            v-else-if="resultadoRegulador === 'EXTENDIDO'"
            v-model="nuevaFechaRegulador"
            label="Nueva fecha retorno"
            type="date"
            required
            hint="Por defecto: visita + 1 día"
            :disabled="accesorioResuelto"
          />
          <AppInput
            v-else
            v-model="observacionRegulador"
            label="Observación"
            placeholder="Detalle del intento"
            :disabled="accesorioResuelto"
          />
        </div>
      </div>

      <div v-if="lineas.length > 0" class="space-y-3">
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">Cilindros</p>
        <div
          v-for="linea in lineas"
          :key="linea.id"
          class="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ linea.codigoBalon }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ linea.numeroPrestamo || linea.numeroAlquiler || '—' }}
                <template v-if="linea.nombreProductoGas">
                  · {{ linea.nombreProductoGas }}
                </template>
                <template v-if="linea.fechaVencimiento">
                  · Vence {{ linea.fechaVencimiento }}
                </template>
              </p>
              <p
                v-if="linea.capacidad != null || linea.nombreUnidad"
                class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
              >
                Capacidad
                {{ linea.capacidad != null ? linea.capacidad : '—' }}
                {{ linea.nombreUnidad || '' }}
              </p>
            </div>
            <AppSelect
              v-model="linea.resultado"
              label="Resultado"
              :options="resultadoOptions"
              :disabled="linea.resuelto"
              class="min-w-[180px]"
            />
          </div>

          <div
            v-if="linea.resultado === 'RECOGIDO'"
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <AppSelect
              v-model="linea.nombreEstadoContenido"
              label="Contenido al recojo"
              :options="contenidoOptions"
              :disabled="linea.resuelto"
              @update:model-value="onContenidoChange(linea)"
            />
            <AppInput
              v-model="linea.cantidadRestante"
              :label="`Cantidad restante${linea.nombreUnidad ? ` (${linea.nombreUnidad})` : ''}`"
              type="number"
              :step="stepInputCantidadPorUnidad(linea.nombreUnidad, true)"
              :min="0"
              :max="linea.capacidad ?? undefined"
              :hint="hintCantidad(linea)"
              placeholder="Ej. mitad del cilindro"
              :disabled="linea.resuelto"
            />
            <AlmacenSelectField
              v-model="linea.idAlmacenDestino"
              label="Almacén destino"
              searchable
              required
              :disabled="linea.resuelto"
              class="sm:col-span-2"
            />
          </div>

          <div
            v-else-if="linea.resultado === 'EXTENDIDO'"
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <AppInput
              v-model="linea.nuevaFechaRetorno"
              label="Nueva fecha retorno"
              type="date"
              required
              hint="Por defecto: visita + 1 día"
              :disabled="linea.resuelto"
            />
            <AppInput
              v-model="linea.observacion"
              label="Motivo extensión"
              placeholder="Ej. gas sin usar, cliente pide un día más"
              :disabled="linea.resuelto"
            />
          </div>

          <AppInput
            v-else
            v-model="linea.observacion"
            label="Observación"
            placeholder="Detalle del intento"
            class="mt-1"
            :disabled="linea.resuelto"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="mutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="mutation.isPending.value || !puedeGuardar"
        @click="confirmar"
      >
        {{ mutation.isPending.value ? 'Registrando...' : 'Registrar resultado' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import { useRegistrarResultadoRecojoMutation, useUpdateRecojoMutation } from '@/modules/balones/recojos/composables/useRecojoMutations'
import { useRecojoQuery } from '@/modules/balones/recojos/composables/useRecojosQuery'
import {
  CONDICIONES_REGULADOR,
  MOTIVOS_FALLO_RECOJO,
  RESULTADOS_RECOJO,
  type CondicionReguladorNombre,
  type ResultadoRecojoNombre,
} from '@/modules/balones/recojos/interfaces/recojo.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppHelpTip, AppInput, AppModal, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { hoyIsoLima } from '@/shared/utils/date'
import {
  abrirRutaGoogleMaps,
  clienteTieneCoordenadas,
} from '@/shared/utils/googleMapsRuta'
import { stepInputCantidadPorUnidad } from '@/shared/utils/unidadMedidaCantidad'

interface LineaResultado {
  id: number
  resuelto: boolean
  idPrestamoDetalle?: number
  idAlquilerDetalle?: number
  codigoBalon: string
  numeroPrestamo: string
  numeroAlquiler: string
  nombreProductoGas: string
  fechaVencimiento: string
  capacidad: number | null
  nombreUnidad: string
  resultado: ResultadoRecojoNombre
  nombreEstadoContenido: string
  cantidadRestante: string
  nuevaFechaRetorno: string
  idAlmacenDestino: number | ''
  observacion: string
}

const props = defineProps<{
  recojoId?: number | null
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const mutation = useRegistrarResultadoRecojoMutation()
const updateMutation = useUpdateRecojoMutation()
const recojoIdRef = computed(() => (open.value ? props.recojoId : null))
const recojoQuery = useRecojoQuery(recojoIdRef)
const recojo = computed(() => recojoQuery.data.value ?? null)

const fechaVisita = ref(hoyIsoLima())
const motivoFalloNombre = ref<string | ''>('')
const observacion = ref('')
const lineas = ref<LineaResultado[]>([])
const incluirAccesorio = ref(false)
const resultadoRegulador = ref<ResultadoRecojoNombre>('RECOGIDO')
const condicionRegulador = ref<CondicionReguladorNombre | ''>('BUENO')
const nuevaFechaRegulador = ref('')
const observacionRegulador = ref('')

const resultadoOptions = RESULTADOS_RECOJO.map((r) => ({ value: r.value, label: r.label }))
const condicionOptions = CONDICIONES_REGULADOR.map((c) => ({ value: c.value, label: c.label }))
const motivoOptions = [
  { value: '', label: 'Sin motivo' },
  ...MOTIVOS_FALLO_RECOJO.map((m) => ({ value: m.value, label: m.label })),
]
const contenidoOptions = [
  { value: 'VACIO', label: 'Vacío' },
  { value: 'LLENO', label: 'Lleno' },
  { value: 'DESCONOCIDO', label: 'Desconocido' },
]

const recojoLabel = computed(() => {
  if (!recojo.value) return undefined
  return [recojo.value.nombre_cliente, recojo.value.fecha_programada?.slice(0, 10)]
    .filter(Boolean)
    .join(' · ')
})

const puedeIniciarRuta = computed(() =>
  clienteTieneCoordenadas(recojo.value?.latitud, recojo.value?.longitud),
)

const recojoIncluyeAccesorio = computed(() => {
  if (!recojo.value) return false
  if (recojo.value.tiene_regulador || recojo.value.es_solo_regulador) return true
  return Boolean(recojo.value.id_alquiler && (recojo.value.detalles ?? []).length === 0)
})

const puedeOptarAccesorio = computed(() => {
  if (!recojo.value || recojoIncluyeAccesorio.value) return false
  return Boolean(
    recojo.value.id_alquiler &&
      (recojo.value.id_producto_alquiler || recojo.value.nombre_producto_alquiler),
  )
})

const mostrarAccesorio = computed(
  () => recojoIncluyeAccesorio.value || incluirAccesorio.value,
)

const accesorioResuelto = computed(() =>
  Boolean(recojo.value?.nombre_resultado_regulador),
)

const etiquetaRegulador = computed(() => {
  const r = recojo.value
  if (!r) return 'Regulador / accesorio'
  return (
    [r.codigo_producto_alquiler, r.nombre_producto_alquiler].filter(Boolean).join(' — ') ||
    'Regulador / accesorio'
  )
})

const reguladorValido = computed(() => {
  if (!mostrarAccesorio.value) return true
  if (resultadoRegulador.value === 'EXTENDIDO') return Boolean(nuevaFechaRegulador.value)
  if (resultadoRegulador.value === 'RECOGIDO') return Boolean(condicionRegulador.value)
  return true
})

const puedeGuardar = computed(() => {
  if (!fechaVisita.value || !reguladorValido.value) return false
  if (lineas.value.length > 0) return lineas.value.every(validarLinea)
  return mostrarAccesorio.value
})

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function parseCantidad(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function hintCantidad(linea: LineaResultado) {
  const um = linea.nombreUnidad || 'u.m.'
  if (linea.capacidad != null) {
    return `Según unidad del producto (${um}). Capacidad: ${linea.capacidad}`
  }
  return `Ingresa la medida restante en ${um}`
}

function onContenidoChange(linea: LineaResultado) {
  if (linea.nombreEstadoContenido === 'VACIO') {
    linea.cantidadRestante = '0'
    return
  }
  if (linea.nombreEstadoContenido === 'LLENO' && linea.capacidad != null) {
    linea.cantidadRestante = String(linea.capacidad)
  }
}

function validarLinea(linea: LineaResultado) {
  if (linea.resuelto) return true
  if (linea.resultado === 'RECOGIDO') {
    if (!linea.idAlmacenDestino) return false
    const cantidad = parseCantidad(linea.cantidadRestante)
    if (cantidad == null) return true
    if (cantidad < 0) return false
    if (linea.capacidad != null && cantidad > Number(linea.capacidad)) return false
    return true
  }
  if (linea.resultado === 'EXTENDIDO') return Boolean(linea.nuevaFechaRetorno)
  return true
}

async function iniciarRuta() {
  const lat = Number(recojo.value?.latitud)
  const lng = Number(recojo.value?.longitud)
  if (!clienteTieneCoordenadas(lat, lng)) return
  abrirRutaGoogleMaps(lat, lng)
  const userId = authStore.user?.id
  if (
    authStore.hasPermission(PermisoBanderas.RECOJOS_BALON_EDITAR) &&
    userId &&
    recojo.value &&
    (recojo.value.nombre_estado ?? '').toUpperCase() === 'PROGRAMADO'
  ) {
    await updateMutation.mutateAsync({
      id: recojo.value.id,
      payload: { idUsuarioAuditoria: userId, estadoNombre: 'EN_RUTA' },
    })
  }
}

watch(
  () => [open.value, recojo.value?.id] as const,
  ([isOpen]) => {
    if (!isOpen || !recojo.value) return
    fechaVisita.value = hoyIsoLima()
    motivoFalloNombre.value = recojo.value.nombre_motivo_fallo || ''
    observacion.value = recojo.value.observacion || ''
    incluirAccesorio.value = recojoIncluyeAccesorio.value
    const resultadoAcc = asResultado(recojo.value.nombre_resultado_regulador)
    resultadoRegulador.value = resultadoAcc ?? 'RECOGIDO'
    condicionRegulador.value =
      (recojo.value.nombre_condicion_regulador as CondicionReguladorNombre | null) || 'BUENO'
    observacionRegulador.value = recojo.value.observacion_regulador || ''
    const manana = addDaysIso(fechaVisita.value, 1)
    nuevaFechaRegulador.value =
      recojo.value.nueva_fecha_retorno_regulador?.slice(0, 10) || manana
    lineas.value = (recojo.value.detalles ?? []).map((d) => {
      const capacidad =
        d.capacidad != null && d.capacidad !== '' ? Number(d.capacidad) : null
      const resuelto = Boolean(d.nombre_resultado)
      return {
        id: d.id,
        resuelto,
        idPrestamoDetalle: d.id_prestamo_detalle ?? undefined,
        idAlquilerDetalle: d.id_alquiler_detalle ?? undefined,
        codigoBalon: d.codigo_balon || (d.id_balon ? `#${d.id_balon}` : `Detalle #${d.id}`),
        numeroPrestamo: d.numero_origen || d.numero_prestamo || '',
        numeroAlquiler: d.origen === 'ALQUILER' ? (d.numero_origen || d.numero_alquiler || '') : '',
        nombreProductoGas: d.nombre_producto_gas || '',
        fechaVencimiento: d.fecha_vencimiento?.slice(0, 10) || '',
        capacidad: Number.isFinite(capacidad as number) ? (capacidad as number) : null,
        nombreUnidad: d.nombre_unidad_medida || d.descripcion_unidad_medida || '',
        resultado: asResultado(d.nombre_resultado) ?? ('RECOGIDO' as ResultadoRecojoNombre),
        nombreEstadoContenido: d.nombre_estado_contenido || 'VACIO',
        cantidadRestante:
          d.cantidad_restante != null && d.cantidad_restante !== ''
            ? String(d.cantidad_restante)
            : '0',
        nuevaFechaRetorno: d.nueva_fecha_retorno?.slice(0, 10) || manana,
        idAlmacenDestino: (d.id_almacen_destino ?? '') as number | '',
        observacion: d.observacion || '',
      }
    })
  },
)

function asResultado(nombre?: string | null): ResultadoRecojoNombre | null {
  const u = (nombre ?? '').toUpperCase()
  if (u === 'RECOGIDO' || u === 'NO_RECOGIDO' || u === 'EXTENDIDO') return u
  return null
}

watch(fechaVisita, (fecha) => {
  const manana = addDaysIso(fecha || hoyIsoLima(), 1)
  for (const linea of lineas.value) {
    if (linea.resultado === 'EXTENDIDO' && !linea.nuevaFechaRetorno) {
      linea.nuevaFechaRetorno = manana
    }
  }
  if (resultadoRegulador.value === 'EXTENDIDO' && !nuevaFechaRegulador.value) {
    nuevaFechaRegulador.value = manana
  }
})

async function confirmar() {
  const userId = authStore.user?.id
  if (!userId || !props.recojoId || !puedeGuardar.value) {
    toastWarning('Completa fecha, regulador (si aplica) y resultados de cada ítem')
    return
  }

  const cilindrosNoRecogidos =
    lineas.value.length > 0 && lineas.value.every((l) => l.resultado === 'NO_RECOGIDO')
  const reguladorNoRecogido = mostrarAccesorio.value && resultadoRegulador.value === 'NO_RECOGIDO'
  const todoFallo =
    (lineas.value.length === 0 || cilindrosNoRecogidos) &&
    (!mostrarAccesorio.value || reguladorNoRecogido)

  if (todoFallo && !motivoFalloNombre.value) {
    toastWarning('Indica el motivo cuando no se recoge ningún ítem')
    return
  }

  for (const linea of lineas.value) {
    if (linea.resultado !== 'RECOGIDO') continue
    const cantidad = parseCantidad(linea.cantidadRestante)
    if (cantidad != null && linea.capacidad != null && cantidad > Number(linea.capacidad)) {
      toastWarning(
        `Cantidad restante de ${linea.codigoBalon} supera la capacidad (${linea.capacidad} ${linea.nombreUnidad})`,
      )
      return
    }
  }

  try {
    await mutation.mutateAsync({
      id: Number(props.recojoId),
      payload: {
        idUsuarioAuditoria: userId,
        fechaVisita: fechaVisita.value,
        motivoFalloNombre: motivoFalloNombre.value || undefined,
        observacion: observacion.value.trim() || undefined,
        detalles: lineas.value.map((l) => {
          const cantidad = parseCantidad(l.cantidadRestante)
          return {
            idPrestamoDetalle: l.idPrestamoDetalle,
            idAlquilerDetalle: l.idAlquilerDetalle,
            resultado: l.resultado,
            nombreEstadoContenido:
              l.resultado === 'RECOGIDO' ? l.nombreEstadoContenido || 'VACIO' : undefined,
            cantidadRestante:
              l.resultado === 'RECOGIDO' && cantidad != null ? cantidad : undefined,
            nuevaFechaRetorno:
              l.resultado === 'EXTENDIDO' ? l.nuevaFechaRetorno || undefined : undefined,
            idAlmacenDestino:
              l.resultado === 'RECOGIDO' && l.idAlmacenDestino
                ? Number(l.idAlmacenDestino)
                : undefined,
            observacion: l.observacion.trim() || undefined,
          }
        }),
        regulador: mostrarAccesorio.value
          ? {
              resultado: resultadoRegulador.value,
              condicion:
                resultadoRegulador.value === 'RECOGIDO'
                  ? (condicionRegulador.value as CondicionReguladorNombre)
                  : undefined,
              nuevaFechaRetorno:
                resultadoRegulador.value === 'EXTENDIDO'
                  ? nuevaFechaRegulador.value || undefined
                  : undefined,
              observacion: observacionRegulador.value.trim() || undefined,
            }
          : undefined,
      },
    })
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation
  }
}
</script>
