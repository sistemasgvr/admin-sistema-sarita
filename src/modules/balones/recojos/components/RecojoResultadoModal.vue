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

      <div class="space-y-3">
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">Cilindros</p>
        <div
          v-for="linea in lineas"
          :key="linea.idPrestamoDetalle ?? linea.idAlquilerDetalle"
          class="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ linea.codigoBalon }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ linea.numeroPrestamo || linea.numeroAlquiler || '—' }}
                <template v-if="linea.fechaVencimiento">
                  · Vence {{ linea.fechaVencimiento }}
                </template>
              </p>
            </div>
            <AppSelect
              v-model="linea.resultado"
              label="Resultado"
              :options="resultadoOptions"
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
            />
            <AlmacenSelectField
              v-model="linea.idAlmacenDestino"
              label="Almacén destino"
              searchable
              required
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
            />
            <AppInput
              v-model="linea.observacion"
              label="Motivo extensión"
              placeholder="Ej. gas sin usar, cliente pide un día más"
            />
          </div>

          <AppInput
            v-else
            v-model="linea.observacion"
            label="Observación"
            placeholder="Detalle del intento"
            class="mt-1"
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
import { useRegistrarResultadoRecojoMutation } from '@/modules/balones/recojos/composables/useRecojoMutations'
import { useRecojoQuery } from '@/modules/balones/recojos/composables/useRecojosQuery'
import {
  MOTIVOS_FALLO_RECOJO,
  RESULTADOS_RECOJO,
  type ResultadoRecojoNombre,
} from '@/modules/balones/recojos/interfaces/recojo.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import { toastWarning } from '@/shared/composables/useToast'

interface LineaResultado {
  idPrestamoDetalle?: number
  idAlquilerDetalle?: number
  codigoBalon: string
  numeroPrestamo: string
  numeroAlquiler: string
  fechaVencimiento: string
  resultado: ResultadoRecojoNombre
  nombreEstadoContenido: string
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
const recojoIdRef = computed(() => (open.value ? props.recojoId : null))
const recojoQuery = useRecojoQuery(recojoIdRef)
const recojo = computed(() => recojoQuery.data.value ?? null)

const fechaVisita = ref(new Date().toISOString().slice(0, 10))
const motivoFalloNombre = ref<string | ''>('')
const observacion = ref('')
const lineas = ref<LineaResultado[]>([])

const resultadoOptions = RESULTADOS_RECOJO.map((r) => ({ value: r.value, label: r.label }))
const motivoOptions = [
  { value: '', label: 'Sin motivo' },
  ...MOTIVOS_FALLO_RECOJO.map((m) => ({ value: m.value, label: m.label })),
]
const contenidoOptions = [
  { value: 'VACIO', label: 'Vacío' },
  { value: 'LLENO', label: 'Lleno (gas no usado)' },
  { value: 'DESCONOCIDO', label: 'Desconocido' },
]

const recojoLabel = computed(() => {
  if (!recojo.value) return undefined
  return [recojo.value.nombre_cliente, recojo.value.fecha_programada?.slice(0, 10)]
    .filter(Boolean)
    .join(' · ')
})

const puedeGuardar = computed(
  () => Boolean(fechaVisita.value) && lineas.value.length > 0 && lineas.value.every(validarLinea),
)

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function validarLinea(linea: LineaResultado) {
  if (linea.resultado === 'RECOGIDO') return Boolean(linea.idAlmacenDestino)
  if (linea.resultado === 'EXTENDIDO') return Boolean(linea.nuevaFechaRetorno)
  return true
}

watch(
  () => [open.value, recojo.value?.id] as const,
  ([isOpen]) => {
    if (!isOpen || !recojo.value) return
    fechaVisita.value = new Date().toISOString().slice(0, 10)
    motivoFalloNombre.value = ''
    observacion.value = ''
    const manana = addDaysIso(fechaVisita.value, 1)
    lineas.value = (recojo.value.detalles ?? [])
      .filter((d) => !d.fecha_devolucion && !d.nombre_resultado)
      .map((d) => ({
        idPrestamoDetalle: d.id_prestamo_detalle ?? undefined,
        idAlquilerDetalle: d.id_alquiler_detalle ?? undefined,
        codigoBalon: d.codigo_balon || (d.id_balon ? `#${d.id_balon}` : `Detalle #${d.id}`),
        numeroPrestamo: d.numero_origen || d.numero_prestamo || '',
        numeroAlquiler: d.origen === 'ALQUILER' ? (d.numero_origen || d.numero_alquiler || '') : '',
        fechaVencimiento: d.fecha_vencimiento?.slice(0, 10) || '',
        resultado: 'RECOGIDO' as ResultadoRecojoNombre,
        nombreEstadoContenido: 'VACIO',
        nuevaFechaRetorno: manana,
        idAlmacenDestino: '' as number | '',
        observacion: '',
      }))
  },
)

watch(fechaVisita, (fecha) => {
  const manana = addDaysIso(fecha || new Date().toISOString().slice(0, 10), 1)
  for (const linea of lineas.value) {
    if (linea.resultado === 'EXTENDIDO' && !linea.nuevaFechaRetorno) {
      linea.nuevaFechaRetorno = manana
    }
  }
})

async function confirmar() {
  const userId = authStore.user?.id
  if (!userId || !props.recojoId || !puedeGuardar.value) {
    toastWarning('Completa fecha y resultados de cada cilindro')
    return
  }

  const todosNoRecogidos = lineas.value.every((l) => l.resultado === 'NO_RECOGIDO')
  if (todosNoRecogidos && !motivoFalloNombre.value) {
    toastWarning('Indica el motivo cuando no se recoge ningún cilindro')
    return
  }

  try {
    await mutation.mutateAsync({
      id: Number(props.recojoId),
      payload: {
        idUsuarioAuditoria: userId,
        fechaVisita: fechaVisita.value,
        motivoFalloNombre: motivoFalloNombre.value || undefined,
        observacion: observacion.value.trim() || undefined,
        detalles: lineas.value.map((l) => ({
          idPrestamoDetalle: l.idPrestamoDetalle,
          idAlquilerDetalle: l.idAlquilerDetalle,
          resultado: l.resultado,
          nombreEstadoContenido:
            l.resultado === 'RECOGIDO' ? l.nombreEstadoContenido || 'VACIO' : undefined,
          nuevaFechaRetorno:
            l.resultado === 'EXTENDIDO' ? l.nuevaFechaRetorno || undefined : undefined,
          idAlmacenDestino:
            l.resultado === 'RECOGIDO' && l.idAlmacenDestino
              ? Number(l.idAlmacenDestino)
              : undefined,
          observacion: l.observacion.trim() || undefined,
        })),
      },
    })
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation
  }
}
</script>
