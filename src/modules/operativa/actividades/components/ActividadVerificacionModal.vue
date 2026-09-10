<template>
  <AppModal
    v-model="open"
    :title="esRecojo ? 'Verificación del recojo' : 'Verificación de la entrega'"
    :subtitle="actividad?.titulo"
    size="xl"
  >
    <div class="space-y-4">
      <p
        v-if="preparando"
        class="rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300"
      >
        Preparando ítems del origen para verificación...
      </p>

      <p
        v-else-if="!puedeVerificarSesion"
        class="rounded-lg border border-warning-200 bg-warning-50/60 px-3 py-2 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400"
      >
        {{ motivoBloqueoSesion }}
      </p>

      <p
        v-else-if="esRecojo && !enRuta"
        class="rounded-lg border border-warning-200 bg-warning-50/60 px-3 py-2 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400"
      >
        Primero inicia el recojo. Luego, al recoger, escanea o marca cada ítem.
      </p>

      <p
        v-else-if="!esRecojo && !enRuta"
        class="rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300"
      >
        Verifica la salida del almacén. La llegada se habilita al iniciar la entrega.
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="opcion in momentosVisibles"
          :key="opcion.valor"
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="
            momento === opcion.valor
              ? 'bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10'
              : 'text-gray-500 hover:text-gray-700'
          "
          :disabled="tabMomentoDeshabilitado(opcion.valor)"
          @click="seleccionarMomento(opcion.valor)"
        >
          {{ opcion.label }}
        </button>

        <AppBadge size="sm" variant="light" :color="resumenColor" class="ml-auto">
          {{ resumenTexto }}
        </AppBadge>
      </div>

      <!-- Escaneo: marca y guarda la fila al instante -->
      <div
        class="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
      >
        <AppInput
          v-model="codigo"
          label="Escanear código"
          placeholder="Escanea o escribe y pulsa Enter"
          class="min-w-0 flex-1"
          :disabled="bloqueado"
          @keyup.enter="escanearYMarcar"
        />
        <BalonBarcodeScanButton
          :disabled="bloqueado"
          modal-title="Escanear ítem"
          @captured="onEscaneado"
        />
      </div>

      <div class="space-y-2">
        <div
          v-for="fila in filas"
          :key="fila.key"
          class="rounded-xl border p-3 transition-colors dark:border-gray-700"
          :class="
            resaltadoId === fila.item.id
              ? 'border-brand-400 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/10'
              : 'border-gray-200'
          "
        >
          <div class="flex items-start gap-3">
            <AppCheckbox
              class="pt-0.5"
              :model-value="estaMarcado(fila.item)"
              :disabled="bloqueado || guardandoItemId === fila.item.id"
              @update:model-value="(v) => onToggleFila(fila.item, v)"
            />

            <div class="min-w-0 flex-1 space-y-2">
              <div>
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                  <span class="mr-1.5 text-gray-400">{{ fila.item.item }}.</span>
                  {{ fila.titulo }}
                </p>
                <p
                  v-if="fila.descripcion"
                  class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ fila.descripcion }}
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-1.5">
                <AppBadge size="sm" variant="light" :color="fila.clase === 'CILINDRO' ? 'primary' : 'neutral'">
                  {{ fila.clase === 'CILINDRO' ? 'Cilindro' : 'Accesorio' }}
                </AppBadge>
                <AppBadge
                  v-if="fila.tipoBalon"
                  size="sm"
                  variant="light"
                  :color="tipoBalonBadgeColor(fila.tipoBalon)"
                >
                  {{ fila.tipoBalon }}
                </AppBadge>
              </div>

              <dl class="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                <div v-if="fila.codigo" class="flex min-w-0 gap-1.5 text-xs">
                  <dt class="shrink-0 text-gray-400">Código</dt>
                  <dd class="min-w-0 truncate font-mono font-medium text-gray-700 dark:text-gray-200">
                    {{ fila.codigo }}
                  </dd>
                </div>
                <div v-if="fila.serie" class="flex min-w-0 gap-1.5 text-xs">
                  <dt class="shrink-0 text-gray-400">Serie</dt>
                  <dd class="min-w-0 truncate font-mono text-gray-700 dark:text-gray-200">
                    {{ fila.serie }}
                  </dd>
                </div>
                <div v-if="fila.gas" class="flex min-w-0 gap-1.5 text-xs">
                  <dt class="shrink-0 text-gray-400">Gas</dt>
                  <dd class="min-w-0 truncate text-gray-700 dark:text-gray-200">
                    {{ fila.gas }}
                  </dd>
                </div>
                <div class="flex min-w-0 gap-1.5 text-xs">
                  <dt class="shrink-0 text-gray-400">Cant.</dt>
                  <dd class="tabular-nums text-gray-700 dark:text-gray-200">
                    <span class="font-medium">{{ fila.cantidadLabel }}</span>
                    <span
                      v-if="fila.unidad"
                      class="ml-1 uppercase text-gray-500"
                    >
                      {{ fila.unidad }}
                    </span>
                  </dd>
                </div>
              </dl>

              <p
                v-if="observacionDe(fila.item)"
                class="text-xs text-warning-600 dark:text-warning-400"
              >
                Obs: {{ observacionDe(fila.item) }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                class="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50"
                :class="
                  observacionDe(fila.item)
                    ? 'border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
                "
                :disabled="bloqueado || !fila.item.id"
                :title="'Agregar o editar observación'"
                @click="abrirObservacion(fila.item)"
              >
                Obs.
              </button>
              <AppBadge size="sm" variant="light" :color="colorEstado(estadoDe(fila.item))">
                {{ etiquetaEstado(estadoDe(fila.item)) }}
              </AppBadge>
            </div>
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

  <AppModal
    v-model="obsOpen"
    title="Observación del ítem"
    :subtitle="obsItemLabel"
    size="sm"
  >
    <AppInput
      v-model="obsTexto"
      label="¿Qué se encontró?"
      placeholder="Ej. abolladura leve, etiqueta dañada..."
      :disabled="guardando"
    />
    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        :disabled="guardando"
        @click="obsOpen = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="rounded-lg bg-warning-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-warning-600 disabled:opacity-70"
        :disabled="guardando || !obsTexto.trim() || !obsItemId"
        @click="guardarObservacion"
      >
        {{ guardando ? 'Guardando...' : 'Guardar observación' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import {
  estaAsignada,
  puedeVerificarComoResponsable,
} from '@/modules/operativa/actividades/utils/actividadEstado'
import { tipoBalonBadgeColor } from '@/modules/balones/utils/tipoBalonBadge'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppCheckbox, AppInput, AppModal } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'
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

const enRuta = computed(() =>
  esActividadEnRuta(props.actividad?.nombre_estado_actividad),
)

const momentos = computed(() =>
  esRecojo.value
    ? [{ valor: 'LLEGADA' as const, label: 'Confirmación de recogido' }]
    : [
        { valor: 'SALIDA' as const, label: 'Salida del almacén' },
        { valor: 'LLEGADA' as const, label: 'Llegada al cliente' },
      ],
)

/** En ruta solo se verifica LLEGADA; sin ruta, SALIDA (y LLEGADA queda bloqueada). */
const momentosVisibles = computed(() => {
  if (esRecojo.value) return momentos.value
  if (enRuta.value) {
    return momentos.value.filter((m) => m.valor === 'LLEGADA')
  }
  return momentos.value
})

const momento = ref<MomentoVerificacion>('SALIDA')
const codigo = ref('')
const iniciandoLocal = ref(false)
const guardandoItemId = ref<number | null>(null)
const resaltadoId = ref<number | null>(null)
let resaltadoTimer: ReturnType<typeof setTimeout> | null = null

const obsOpen = ref(false)
const obsItemId = ref<number | null>(null)
const obsTexto = ref('')
const obsItemLabel = ref('')

const guardando = computed(() => mutation.isPending.value)
const preparando = computed(
  () => iniciandoLocal.value || iniciarMutation.isPending.value,
)
const items = computed(() => props.actividad?.items ?? [])

const puedeVerificarSesion = computed(() =>
  puedeVerificarComoResponsable(props.actividad, {
    userId: authStore.user?.id,
    trabajadorId: authStore.userTrabajadorId,
    tienePermiso: authStore.hasPermission(PermisoBanderas.ACTIVIDADES_VERIFICAR),
  }),
)

const motivoBloqueoSesion = computed(() => {
  if (!estaAsignada(props.actividad)) {
    return 'Toma la actividad con tu usuario de sesión antes de verificar. El responsable asignado responde por esta verificación.'
  }
  return 'Solo el responsable asignado (tu usuario de sesión) puede verificar esta actividad.'
})

const bloqueado = computed(
  () =>
    guardando.value ||
    preparando.value ||
    !puedeVerificarSesion.value ||
    (esRecojo.value && !enRuta.value) ||
    (!esRecojo.value && !enRuta.value && momento.value === 'LLEGADA'),
)

function tabMomentoDeshabilitado(valor: MomentoVerificacion) {
  if (esRecojo.value) return !enRuta.value
  if (valor === 'LLEGADA') return !enRuta.value
  if (valor === 'SALIDA') return enRuta.value
  return false
}

function seleccionarMomento(valor: MomentoVerificacion) {
  if (tabMomentoDeshabilitado(valor)) return
  momento.value = valor
}

const estadoDe = (item: ActividadItem) =>
  momento.value === 'SALIDA'
    ? item.estado_verificacion_salida
    : item.estado_verificacion_llegada

const observacionDe = (item: ActividadItem) =>
  momento.value === 'SALIDA' ? item.observacion_salida : item.observacion_llegada

const claseDe = (item: ActividadItem): ClaseItemActividad =>
  claseItemActividad(item, items.value)

function estaMarcado(item: ActividadItem) {
  const est = estadoDe(item)
  return est === 'OK' || est === 'CON_OBSERVACION'
}

function formatCantidad(valor: number | string | null | undefined) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return '0'
  return String(Number(n.toFixed(4)))
}

const filas = computed(() =>
  items.value
    .filter((item) => claseDe(item) !== 'GAS')
    .map((item) => {
      const clase = claseDe(item)
      const gasDeLinea =
        clase === 'CILINDRO'
          ? items.value.find((otro) => {
              if (claseDe(otro) !== 'GAS') return false
              if (
                item.id_producto_gas != null &&
                otro.id_producto === item.id_producto_gas
              ) {
                return true
              }
              const nombreGas = (item.nombre_producto_gas ?? '').trim().toUpperCase()
              const nombreOtro = (otro.nombre_producto ?? '').trim().toUpperCase()
              return Boolean(nombreGas && nombreOtro && nombreGas === nombreOtro)
            })?.nombre_producto
          : null
      const gas = item.nombre_producto_gas || gasDeLinea || null

      const titulo = item.nombre_producto || item.descripcion || 'Ítem'
      const descripcion =
        item.descripcion &&
        item.descripcion !== item.nombre_producto &&
        item.descripcion !== item.codigo_balon
          ? item.descripcion
          : null

      return {
        key: String(item.id ?? item.item),
        item,
        clase,
        titulo,
        descripcion,
        tipoBalon: item.nombre_tipo_balon || null,
        codigo: item.codigo_balon || null,
        serie: item.numero_serie_balon || null,
        gas: clase === 'CILINDRO' ? gas : null,
        cantidadLabel: formatCantidad(item.cantidad),
        unidad: item.nombre_unidad_medida || null,
      }
    }),
)

const pendientes = computed(
  () =>
    filas.value.filter(
      (fila) => (estadoDe(fila.item) ?? 'PENDIENTE') === 'PENDIENTE',
    ).length,
)
const observados = computed(
  () =>
    filas.value.filter((fila) => estadoDe(fila.item) === 'CON_OBSERVACION').length,
)
const completo = computed(() => filas.value.length > 0 && pendientes.value === 0)

const resumenTexto = computed(() => {
  if (filas.value.length === 0) return items.value.length === 0 ? 'Sin ítems' : 'Sin ítems verificables'
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
  if (filas.value.length === 0 || pendientes.value > 0) return ''
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

function resaltar(id: number | null | undefined) {
  if (!id) return
  resaltadoId.value = id
  if (resaltadoTimer) clearTimeout(resaltadoTimer)
  resaltadoTimer = setTimeout(() => {
    if (resaltadoId.value === id) resaltadoId.value = null
  }, 1600)
}

async function asegurarItemsMaterializados() {
  const act = props.actividad
  const idUsuarioAuditoria = authStore.user?.id
  if (!act?.id || !idUsuarioAuditoria) return
  const tieneItems = (act.items?.length ?? 0) > 0
  const esRecojoOrigen = Boolean(act.id_prestamo || act.id_alquiler || act.detalle_origen)
  if (tieneItems || !esRecojoOrigen) return

  iniciandoLocal.value = true
  try {
    await iniciarMutation.mutateAsync({
      id: act.id,
      idUsuarioAuditoria,
    })
  } finally {
    iniciandoLocal.value = false
  }
}

/** Guarda lecturas; true solo si la mutación terminó bien. */
async function enviarLecturas(
  lecturas: LecturaVerificacion[],
  itemId?: number | null,
): Promise<boolean> {
  if (!props.actividad || lecturas.length === 0) return false
  if (!puedeVerificarSesion.value) return false
  const idUsuarioAuditoria = authStore.user?.id
  if (!idUsuarioAuditoria) return false
  guardandoItemId.value = itemId ?? null
  try {
    await asegurarItemsMaterializados()
    await mutation.mutateAsync({
      id: props.actividad.id,
      payload: {
        momento: momento.value,
        lecturas,
        idUsuarioAuditoria,
      },
    })
    return true
  } catch {
    // toast en mutation
    return false
  } finally {
    guardandoItemId.value = null
  }
}

async function onToggleFila(item: ActividadItem, marcado: boolean) {
  if (!item.id || bloqueado.value) return
  if (marcado) {
    resaltar(item.id)
    await enviarLecturas(
      [
        {
          idItem: item.id,
          cantidad: Number(item.cantidad) || undefined,
          conforme: true,
        },
      ],
      item.id,
    )
  } else {
    await enviarLecturas([{ idItem: item.id, pendiente: true }], item.id)
  }
}

async function escanearYMarcar() {
  const valor = codigo.value.trim().toUpperCase()
  if (!valor || bloqueado.value) return
  codigo.value = ''

  const fila = filas.value.find((f) => {
    const cod = (f.codigo || '').toUpperCase()
    const serie = (f.item.numero_serie_balon || '').toUpperCase()
    const desc = (f.item.descripcion || '').trim().toUpperCase()
    return cod === valor || serie === valor || (desc !== '' && desc === valor)
  })
  if (fila?.item.id) resaltar(fila.item.id)

  await enviarLecturas([{ codigo: valor, conforme: true }], fila?.item.id)
}

function onEscaneado(valor: string) {
  codigo.value = valor
  void escanearYMarcar()
}

function abrirObservacion(item: ActividadItem) {
  if (!item.id) return
  obsItemId.value = item.id
  obsItemLabel.value = item.nombre_producto || item.descripcion || `Ítem ${item.item}`
  obsTexto.value = observacionDe(item) || ''
  obsOpen.value = true
}

async function guardarObservacion() {
  const id = obsItemId.value
  const texto = obsTexto.value.trim()
  if (!id || !texto) return
  const ok = await enviarLecturas(
    [
      {
        idItem: id,
        cantidad: Number(items.value.find((i) => i.id === id)?.cantidad) || undefined,
        conforme: false,
        observacion: texto,
      },
    ],
    id,
  )
  if (!ok) return
  obsOpen.value = false
  resaltar(id)
}

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

async function iniciarEntrega() {
  if (!props.actividad) return
  const idUsuarioAuditoria = authStore.user?.id
  if (!idUsuarioAuditoria) return
  try {
    await iniciarEntregaMutation.mutateAsync({
      id: props.actividad.id,
      idUsuarioAuditoria,
    })
    momento.value = 'LLEGADA'
  } catch {
    // toast en mutation
  }
}

async function iniciarRecojo() {
  if (!props.actividad) return
  const idUsuarioAuditoria = authStore.user?.id
  if (!idUsuarioAuditoria) return
  try {
    await iniciarRecojoMutation.mutateAsync({
      id: props.actividad.id,
      idUsuarioAuditoria,
    })
    momento.value = 'LLEGADA'
  } catch {
    // toast en mutation
  }
}

async function culminarEntrega() {
  if (!props.actividad) return
  const idUsuarioAuditoria = authStore.user?.id
  if (!idUsuarioAuditoria) return
  try {
    await culminarEntregaMutation.mutateAsync({
      id: props.actividad.id,
      idUsuarioAuditoria,
    })
    open.value = false
  } catch {
    // toast en mutation
  }
}
</script>
