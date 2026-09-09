<template>
  <AppModal
    v-model="open"
    :title="esRecojo ? 'Verificación del recojo' : 'Verificación de la entrega'"
    :subtitle="actividad?.titulo"
    size="xl"
  >
    <div class="space-y-5">
      <p
        v-if="preparando"
        class="rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300"
      >
        Preparando ítems del origen para verificación...
      </p>

      <p
        v-else-if="esRecojo && !enRuta"
        class="rounded-lg border border-warning-200 bg-warning-50/60 px-3 py-2 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400"
      >
        Primero inicia el recojo. Luego, al recoger, escanea cada cilindro aquí.
      </p>

      <!-- Momento: salida y llegada se verifican por separado -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="opcion in momentos"
          :key="opcion.valor"
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="
            momento === opcion.valor
              ? 'bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10'
              : 'text-gray-500 hover:text-gray-700'
          "
          :disabled="esRecojo && !enRuta"
          @click="momento = opcion.valor"
        >
          {{ opcion.label }}
        </button>

        <AppBadge
          size="sm"
          variant="light"
          :color="resumenColor"
          class="ml-auto"
        >
          {{ resumenTexto }}
        </AppBadge>
      </div>

      <!-- Captura por escaneo -->
      <div class="rounded-xl border border-gray-200 p-3.5 dark:border-gray-700">
        <div class="flex flex-wrap items-end gap-3">
          <AppInput
            v-model="codigo"
            label="Código del cilindro o producto"
            placeholder="Escanea o escribe y pulsa Enter"
            class="min-w-0 flex-1"
            :disabled="guardando || preparando || (esRecojo && !enRuta)"
            @keyup.enter="agregarCodigo"
          />
          <BalonBarcodeScanButton
            :disabled="guardando || preparando || (esRecojo && !enRuta)"
            modal-title="Escanear ítem"
            @captured="onEscaneado"
          />
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            :disabled="guardando || preparando || (esRecojo && !enRuta) || !codigo.trim()"
            @click="agregarCodigo"
          >
            Agregar
          </button>
        </div>

        <!-- Conformidad: se aplica a la lectura que se añada a continuación -->
        <div class="mt-3 flex flex-wrap items-end gap-3">
          <div class="flex items-center gap-2">
            <button
              v-for="opcion in conformidades"
              :key="String(opcion.valor)"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-sm transition"
              :class="
                conforme === opcion.valor
                  ? opcion.valor
                    ? 'border-success-500 bg-success-50 font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400'
                    : 'border-warning-500 bg-warning-50 font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
                  : 'border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5'
              "
              :disabled="guardando || preparando"
              @click="conforme = opcion.valor"
            >
              {{ opcion.label }}
            </button>
          </div>

          <AppInput
            v-model="observacion"
            label="Observación de esta lectura (opcional)"
            placeholder="Qué se encontró"
            class="min-w-0 flex-1"
            :disabled="guardando || preparando"
          />
        </div>

        <!-- Cola pendiente de registrar -->
        <div v-if="cola.length" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="(lectura, i) in cola"
            :key="`${lectura.codigo ?? lectura.idItem}-${i}`"
            class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs"
            :class="
              lectura.conforme === false
                ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
                : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
            "
          >
            {{ etiquetaLectura(lectura) }}
            <button type="button" :disabled="guardando" @click="cola.splice(i, 1)">
              <AppIcon :name="ICONS.x" :size="12" />
            </button>
          </span>
        </div>

        <button
          type="button"
          class="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="guardando || preparando || (esRecojo && !enRuta) || cola.length === 0"
          @click="registrar"
        >
          <AppIcon :name="ICONS.scanBarcode" :size="15" />
          {{ guardando ? 'Registrando...' : `Registrar ${cola.length} lectura(s)` }}
        </button>
      </div>

      <!-- Ítems. El gas no es fila propia: viaja dentro de su cilindro, porque
           la orden de salida lo emite como línea aparte pero el operador lo ve
           como parte del balón que tiene delante. -->
      <div class="space-y-2">
        <div
          v-for="fila in filas"
          :key="fila.key"
          class="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                <span class="mr-1.5 text-gray-400">{{ fila.item.item }}</span>
                {{ fila.titulo }}
              </p>
              <p
                v-if="fila.codigo"
                class="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400"
              >
                {{ fila.codigo }}
              </p>
              <p
                v-if="fila.gas"
                class="mt-1 text-xs text-gray-500 dark:text-gray-400"
              >
                Gas: {{ fila.gas }}
              </p>
              <p
                v-if="observacionDe(fila.item)"
                class="mt-1 text-xs text-warning-600 dark:text-warning-400"
              >
                {{ observacionDe(fila.item) }}
              </p>
            </div>

            <AppBadge size="sm" variant="light" :color="colorEstado(estadoDe(fila.item))">
              {{ etiquetaEstado(estadoDe(fila.item)) }}
            </AppBadge>
          </div>

          <!-- Accesorio: no se prueba por serie, se confirma por cantidad -->
          <div
            v-if="fila.clase === 'ACCESORIO'"
            class="mt-2.5 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-800"
          >
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Confirmado
              <span class="font-medium text-gray-700 dark:text-gray-200">
                {{ verificadaDe(fila.item) }} / {{ fila.item.cantidad }}
              </span>
            </p>
            <input
              v-model.number="cantidades[fila.item.id ?? 0]"
              type="number"
              min="0"
              :max="fila.item.cantidad"
              class="h-9 w-24 rounded-lg border border-gray-300 px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              :disabled="guardando || preparando"
            />
            <button
              type="button"
              class="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              :disabled="guardando || preparando || !puedeConfirmarCantidad(fila.item)"
              @click="encolarCantidad(fila.item)"
            >
              Confirmar cantidad
            </button>
          </div>
        </div>

        <p v-if="filas.length === 0" class="py-6 text-center text-sm text-gray-400">
          {{
            preparando
              ? 'Materializando ítems...'
              : 'Esta actividad no tiene ítems que verificar.'
          }}
        </p>
      </div>

      <p
        v-if="mensajeGate"
        class="rounded-lg border border-warning-200 bg-warning-50/60 px-3 py-2 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400"
      >
        {{ mensajeGate }}
      </p>
    </div>

    <template #footer>
      <div class="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          @click="open = false"
        >
          Cerrar
        </button>

        <button
          v-if="!esRecojo && momento === 'SALIDA' && !enRuta"
          type="button"
          class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="!puedeIniciar || iniciarEntregaMutation.isPending.value"
          @click="iniciarEntrega"
        >
          {{ iniciarEntregaMutation.isPending.value ? 'Iniciando...' : 'Iniciar entrega' }}
        </button>

        <button
          v-if="!esRecojo && momento === 'LLEGADA' && enRuta"
          type="button"
          class="rounded-lg bg-success-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-success-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="!puedeCulminar || culminarEntregaMutation.isPending.value"
          @click="culminarEntrega"
        >
          {{ culminarEntregaMutation.isPending.value ? 'Cerrando...' : 'Culminar entrega' }}
        </button>

        <button
          v-if="esRecojo && !enRuta"
          type="button"
          class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="iniciarRecojoMutation.isPending.value"
          @click="iniciarRecojo"
        >
          {{ iniciarRecojoMutation.isPending.value ? 'Iniciando...' : 'Iniciar recojo' }}
        </button>

        <p
          v-if="esRecojo && enRuta && completo"
          class="w-full text-right text-xs text-gray-500 dark:text-gray-400 sm:w-auto sm:self-center"
        >
          Verificación lista. Culmina el recojo en el detalle eligiendo el almacén.
        </p>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import BalonBarcodeScanButton from '@/modules/balones/cilindros/components/BalonBarcodeScanButton.vue'
import {
  useCulminarEntregaMutation,
  useIniciarEntregaMutation,
  useIniciarRecojoMutation,
  useIniciarVerificacionMutation,
  useVerificarActividadMutation,
} from '@/modules/operativa/actividades/composables/useActividadMutations'
import type {
  Actividad,
  ActividadItem,
  ClaseItemActividad,
  LecturaVerificacion,
  MomentoVerificacion,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'
import {
  claseItemActividad,
  esActividadEnRuta,
  esTipoRecojoNombre,
} from '@/modules/operativa/actividades/utils/actividadTipo'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppInput, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'

const props = defineProps<{ actividad: Actividad | null | undefined }>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const mutation = useVerificarActividadMutation()
const iniciarMutation = useIniciarVerificacionMutation()
const iniciarEntregaMutation = useIniciarEntregaMutation()
const culminarEntregaMutation = useCulminarEntregaMutation()
const iniciarRecojoMutation = useIniciarRecojoMutation()

const esRecojo = computed(() =>
  esTipoRecojoNombre(props.actividad?.nombre_tipo_actividad),
)

const momentos = computed(() =>
  esRecojo.value
    ? [{ valor: 'LLEGADA' as const, label: 'Confirmación de recogido' }]
    : [
        { valor: 'SALIDA' as const, label: 'Salida del almacén' },
        { valor: 'LLEGADA' as const, label: 'Llegada al cliente' },
      ],
)

const conformidades: { valor: boolean; label: string }[] = [
  { valor: true, label: 'Conforme' },
  { valor: false, label: 'Con observación' },
]

const momento = ref<MomentoVerificacion>('SALIDA')
const codigo = ref('')
const observacion = ref('')
const conforme = ref(true)
const cola = ref<LecturaVerificacion[]>([])
const cantidades = reactive<Record<number, number>>({})
const iniciandoLocal = ref(false)

const guardando = computed(() => mutation.isPending.value)
const preparando = computed(
  () => iniciandoLocal.value || iniciarMutation.isPending.value,
)
const items = computed(() => props.actividad?.items ?? [])
const enRuta = computed(() =>
  esActividadEnRuta(props.actividad?.nombre_estado_actividad),
)

const estadoDe = (item: ActividadItem) =>
  momento.value === 'SALIDA'
    ? item.estado_verificacion_salida
    : item.estado_verificacion_llegada

const observacionDe = (item: ActividadItem) =>
  momento.value === 'SALIDA' ? item.observacion_salida : item.observacion_llegada

const verificadaDe = (item: ActividadItem) =>
  (momento.value === 'SALIDA'
    ? item.cantidad_verificada_salida
    : item.cantidad_verificada_llegada) ?? 0

const claseDe = (item: ActividadItem): ClaseItemActividad =>
  claseItemActividad(item, items.value)

/**
 * Filas visibles: cilindros y accesorios. El gas se pliega dentro del cilindro
 * cuyo producto coincide, así que nunca aparece como fila suelta.
 */
const filas = computed(() =>
  items.value
    .filter((item) => claseDe(item) !== 'GAS')
    .map((item) => {
      const clase = claseDe(item)
      const gas =
        clase === 'CILINDRO'
          ? (items.value.find(
              (otro) => claseDe(otro) === 'GAS' && otro.id_producto === item.id_producto,
            )?.nombre_producto ??
            item.nombre_producto_gas ??
            null)
          : null

      return {
        key: String(item.id ?? item.item),
        item,
        clase,
        titulo: item.nombre_producto || item.descripcion || 'Ítem',
        codigo: item.codigo_balon || item.numero_serie_balon || null,
        gas,
      }
    }),
)

const pendientes = computed(
  () => items.value.filter((item) => (estadoDe(item) ?? 'PENDIENTE') === 'PENDIENTE').length,
)
const observados = computed(
  () => items.value.filter((item) => estadoDe(item) === 'CON_OBSERVACION').length,
)
// Solo bloquean los pendientes. CON_OBSERVACION es un aviso leve (raya, etc.)
// que queda registrado pero no detiene iniciar/culminar.
const completo = computed(
  () => items.value.length > 0 && pendientes.value === 0,
)

const resumenTexto = computed(() => {
  if (items.value.length === 0) return 'Sin ítems'
  if (pendientes.value > 0) {
    const partes: string[] = [`${pendientes.value} pendiente(s)`]
    if (observados.value) partes.push(`${observados.value} con observación`)
    return partes.join(' · ')
  }
  if (observados.value > 0) return `Listo · ${observados.value} con observación`
  return 'Todo conforme'
})

const resumenColor = computed<BadgeColor>(() => {
  if (pendientes.value > 0) return 'neutral'
  if (observados.value > 0) return 'warning'
  if (completo.value) return 'success'
  return 'neutral'
})

const puedeIniciar = computed(
  () => completo.value && momento.value === 'SALIDA' && !enRuta.value,
)
const puedeCulminar = computed(
  () => completo.value && momento.value === 'LLEGADA' && enRuta.value,
)

const mensajeGate = computed(() => {
  if (items.value.length === 0 || pendientes.value > 0) return ''
  if (observados.value > 0) {
    return 'Las observaciones leves quedan registradas y no bloquean el avance.'
  }
  return ''
})

function colorEstado(estado?: string | null): BadgeColor {
  if (estado === 'OK') return 'success'
  if (estado === 'CON_OBSERVACION') return 'warning'
  return 'neutral'
}

function etiquetaEstado(estado?: string | null) {
  if (estado === 'OK') return 'Verificado'
  if (estado === 'CON_OBSERVACION') return 'Con observación'
  return 'Pendiente'
}

function etiquetaLectura(lectura: LecturaVerificacion) {
  if (lectura.codigo) return lectura.codigo
  const item = items.value.find((i) => i.id === lectura.idItem)
  return `${item?.nombre_producto || item?.descripcion || 'Ítem'} ×${lectura.cantidad ?? 0}`
}

function puedeConfirmarCantidad(item: ActividadItem) {
  const valor = cantidades[item.id ?? 0]
  return Number.isFinite(valor) && valor > 0
}

function encolarCantidad(item: ActividadItem) {
  if (!item.id || !puedeConfirmarCantidad(item)) return
  cola.value.push({
    idItem: item.id,
    cantidad: cantidades[item.id],
    conforme: conforme.value,
    observacion: observacion.value.trim() || undefined,
  })
  cantidades[item.id] = 0
}

function agregarCodigo() {
  const valor = codigo.value.trim().toUpperCase()
  if (!valor) return
  cola.value.push({
    codigo: valor,
    conforme: conforme.value,
    observacion: observacion.value.trim() || undefined,
  })
  codigo.value = ''
}

function onEscaneado(valor: string) {
  codigo.value = valor
  agregarCodigo()
}

async function asegurarItemsMaterializados() {
  const act = props.actividad
  if (!act?.id) return
  const tieneItems = (act.items?.length ?? 0) > 0
  const esRecojoOrigen = Boolean(act.id_prestamo || act.id_alquiler || act.detalle_origen)
  if (tieneItems || !esRecojoOrigen) return

  iniciandoLocal.value = true
  try {
    await iniciarMutation.mutateAsync({
      id: act.id,
      idUsuarioAuditoria: authStore.user?.id,
    })
  } finally {
    iniciandoLocal.value = false
  }
}

// El momento por defecto: recojo siempre confirma recogido (LLEGADA);
// en reparto, en ruta solo queda la llegada.
watch(
  () => [open.value, enRuta.value, esRecojo.value] as const,
  ([isOpen, ruta, recojo]) => {
    if (!isOpen) return
    momento.value = recojo || ruta ? 'LLEGADA' : 'SALIDA'
  },
  { immediate: true },
)

watch(
  () => [open.value, props.actividad?.id, props.actividad?.items?.length] as const,
  ([isOpen]) => {
    if (!isOpen) return
    void asegurarItemsMaterializados()
  },
  { immediate: true },
)

async function registrar() {
  if (!props.actividad || cola.value.length === 0) return
  try {
    await asegurarItemsMaterializados()
    await mutation.mutateAsync({
      id: props.actividad.id,
      payload: {
        momento: momento.value,
        lecturas: [...cola.value],
        idUsuarioAuditoria: authStore.user?.id,
      },
    })
    cola.value = []
    observacion.value = ''
    conforme.value = true
  } catch {
    // toast en mutation
  }
}

async function iniciarEntrega() {
  if (!props.actividad) return
  try {
    await iniciarEntregaMutation.mutateAsync({
      id: props.actividad.id,
      idUsuarioAuditoria: authStore.user?.id,
    })
    momento.value = 'LLEGADA'
  } catch {
    // toast en mutation
  }
}

async function iniciarRecojo() {
  if (!props.actividad) return
  try {
    await iniciarRecojoMutation.mutateAsync({
      id: props.actividad.id,
      idUsuarioAuditoria: authStore.user?.id,
    })
    momento.value = 'LLEGADA'
  } catch {
    // toast en mutation
  }
}

async function culminarEntrega() {
  if (!props.actividad) return
  try {
    await culminarEntregaMutation.mutateAsync({
      id: props.actividad.id,
      idUsuarioAuditoria: authStore.user?.id,
    })
    open.value = false
  } catch {
    // toast en mutation
  }
}
</script>
