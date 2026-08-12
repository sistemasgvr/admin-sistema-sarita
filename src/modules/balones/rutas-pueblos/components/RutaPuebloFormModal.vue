<template>
  <AppModal
    v-model="open"
    title="Nueva ruta pueblos"
    subtitle="Registra la salida de cilindros con libras. Al retorno se calcula el gas usado en m³."
    size="lg"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="fecha" label="Fecha" type="date" required />
        <AlmacenSelectField v-model="idAlmacen" searchable required />
        <AppSelect
          v-model="idChofer"
          label="Chofer / repartidor"
          placeholder="Opcional"
          :options="choferOptions"
          :loading="choferesLoading"
        />
        <AppInput v-model="observacion" label="Observación" placeholder="Zona, pueblos, etc." />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Cilindros a enviar</p>
            <AppHelpTip
              text="Al elegir el cilindro se sugiere lb desde residual o capacidad del tipo. No puede superar capacidad lb del tipo. La conversión lb/m³ usa capacidad m³ ÷ capacidad lb."
            />
          </div>
          <button
            type="button"
            class="text-xs font-medium text-brand-600 hover:underline"
            @click="addLinea"
          >
            + Añadir
          </button>
        </div>
        <div
          v-for="(linea, index) in lineas"
          :key="linea.key"
          class="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_140px_auto] dark:border-gray-800"
        >
          <PosBalonSelectField
            v-model="linea.idBalon"
            mode="general"
            label="Cilindro"
            :id-almacen="idAlmacen"
            :extra-filters="balonExtraFilters"
            :client-filter="filtroBalonLinea(linea.key)"
            :selection-locked="!idAlmacen"
            :empty-text="
              idAlmacen
                ? 'Sin cilindros disponibles (en almacén o ya agregados).'
                : 'Selecciona el almacén primero.'
            "
            required
            @selected="(balon) => onBalonSelected(linea, balon)"
          />
          <AppInput
            v-model="linea.lbSalida"
            label="Libras al salir"
            type="number"
            step="0.01"
            min="0"
            :max="linea.capacidadLbMax ?? undefined"
            :help="helpLbSalida(linea)"
            required
          />
          <button
            type="button"
            class="mt-6 inline-flex h-10 w-10 items-center justify-center self-start rounded-lg border border-gray-300 text-error-500"
            title="Quitar"
            @click="lineas.splice(index, 1)"
          >
            <AppIcon :name="ICONS.trash" :size="16" />
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        :disabled="saving || !canSave"
        @click="guardar"
      >
        {{ saving ? 'Guardando…' : 'Crear ruta' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import type { Balon, BalonListFilters } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import { useCreateRutaPuebloMutation } from '@/modules/balones/rutas-pueblos/composables/useRutasPueblosMutations'
import { AppHelpTip, AppInput, AppModal, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { toastWarning } from '@/shared/composables/useToast'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const createMutation = useCreateRutaPuebloMutation()
const estadoBalonQuery = useListaOpcionesQuery(ref(ListaIds.ESTADO_BALON))

const fecha = ref(new Date().toISOString().slice(0, 10))
const idAlmacen = ref<number | ''>('')
const idChofer = ref<number | ''>('')
const observacion = ref('')
const choferOptions = ref<{ value: number; label: string }[]>([])
const choferesLoading = ref(false)

type Linea = {
  key: string
  idBalon: number | ''
  lbSalida: string
  /** Tope = capacidad lb del tipo */
  capacidadLbMax: number | null
  /** De dónde salió la sugerencia */
  sugerenciaOrigen: 'residual' | 'tipo' | null
}

function emptyLinea(): Linea {
  return {
    key: crypto.randomUUID(),
    idBalon: '',
    lbSalida: '',
    capacidadLbMax: null,
    sugerenciaOrigen: null,
  }
}

const lineas = ref<Linea[]>([emptyLinea()])

const estadoEnAlmacenId = computed(
  () => estadoBalonQuery.data.value?.find((item) => item.nombre === 'EN_ALMACEN')?.id,
)

/** Solo cilindros EN_ALMACEN del almacén elegido (no prestados / en ruta / recarga, etc.). */
const balonExtraFilters = computed<Partial<BalonListFilters>>(() => {
  const filters: Partial<BalonListFilters> = { soloBajas: false }
  if (estadoEnAlmacenId.value) filters.idEstadoBalon = estadoEnAlmacenId.value
  if (idAlmacen.value) filters.idAlmacen = Number(idAlmacen.value)
  return filters
})

function soloBalonEnviable(balon: Balon) {
  const estado = (balon.nombre_estado_balon ?? '').trim().toUpperCase()
  if (estado !== 'EN_ALMACEN') return false
  if (idAlmacen.value && Number(balon.id_almacen) !== Number(idAlmacen.value)) return false
  return true
}

/** Excluye cilindros ya elegidos en otras líneas (evita duplicar el mismo código). */
function filtroBalonLinea(lineaKey: string) {
  const idsOcupados = new Set(
    lineas.value
      .filter((l) => l.key !== lineaKey && l.idBalon)
      .map((l) => Number(l.idBalon)),
  )
  return (balon: Balon) => {
    if (!soloBalonEnviable(balon)) return false
    return !idsOcupados.has(balon.id)
  }
}

function roundLb(n: number) {
  return Math.round(n * 100) / 100
}

function sugerirLbDesdeBalon(balon: Balon): {
  lb: number | null
  max: number | null
  origen: Linea['sugerenciaOrigen']
} {
  const tipoLb = Number(balon.capacidad_lb)
  const max = Number.isFinite(tipoLb) && tipoLb > 0 ? tipoLb : null
  const residual = Number(balon.capacidad_restante_lb)

  let lb: number | null = null
  let origen: Linea['sugerenciaOrigen'] = null

  if (Number.isFinite(residual) && residual > 0) {
    lb = residual
    origen = 'residual'
  } else if (max != null) {
    lb = max
    origen = 'tipo'
  }

  if (lb != null && max != null) lb = Math.min(lb, max)
  if (lb != null) lb = roundLb(lb)

  return { lb, max, origen }
}

function onBalonSelected(linea: Linea, balon: Balon | null) {
  if (!balon) {
    linea.capacidadLbMax = null
    linea.sugerenciaOrigen = null
    linea.lbSalida = ''
    return
  }
  const { lb, max, origen } = sugerirLbDesdeBalon(balon)
  linea.capacidadLbMax = max
  linea.sugerenciaOrigen = origen
  linea.lbSalida = lb != null ? String(lb) : ''
}

function helpLbSalida(linea: Linea) {
  if (linea.capacidadLbMax == null) return 'Máximo = capacidad lb del tipo.'
  const tope = `Máx. ${linea.capacidadLbMax.toFixed(2)} lb (tipo)`
  if (linea.sugerenciaOrigen === 'residual') return `${tope}. Sugerido desde residual.`
  if (linea.sugerenciaOrigen === 'tipo') return `${tope}. Sugerido = capacidad llena.`
  return tope
}

const saving = computed(() => createMutation.isPending.value)
const canSave = computed(
  () =>
    Boolean(idAlmacen.value) &&
    lineas.value.some((l) => l.idBalon && Number(l.lbSalida) >= 0),
)

function addLinea() {
  lineas.value.push(emptyLinea())
}

watch(idAlmacen, () => {
  for (const linea of lineas.value) {
    linea.idBalon = ''
    linea.lbSalida = ''
    linea.capacidadLbMax = null
    linea.sugerenciaOrigen = null
  }
})

async function loadChoferes() {
  choferesLoading.value = true
  try {
    const res = await choferesService.listar({
      pagina: 1,
      limite: 200,
      idCliente: -1,
    })
    choferOptions.value = (res.data ?? []).map((c) => ({
      value: c.id,
      label: [c.nombres, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' '),
    }))
  } finally {
    choferesLoading.value = false
  }
}

watch(open, (v) => {
  if (!v) return
  fecha.value = new Date().toISOString().slice(0, 10)
  idAlmacen.value = ''
  idChofer.value = ''
  observacion.value = ''
  lineas.value = [emptyLinea()]
  void loadChoferes()
})

async function guardar() {
  const userId = authStore.user?.id
  if (!userId || !idAlmacen.value) return

  const detalles = lineas.value
    .filter((l) => l.idBalon)
    .map((l) => ({
      idBalon: Number(l.idBalon),
      lbSalida: Number(l.lbSalida),
      capacidadLbMax: l.capacidadLbMax,
    }))

  if (detalles.length === 0) {
    toastWarning('Agrega al menos un cilindro')
    return
  }

  if (detalles.some((d) => Number.isNaN(d.lbSalida) || d.lbSalida < 0)) {
    toastWarning('Completa las libras de salida (≥ 0)')
    return
  }

  const sobreTope = detalles.find(
    (d) => d.capacidadLbMax != null && d.lbSalida > d.capacidadLbMax + 1e-9,
  )
  if (sobreTope) {
    toastWarning(
      `Las libras de salida no pueden superar la capacidad del tipo (${sobreTope.capacidadLbMax!.toFixed(2)} lb)`,
    )
    return
  }

  const ids = detalles.map((d) => d.idBalon)
  if (new Set(ids).size !== ids.length) {
    toastWarning('Hay cilindros duplicados en la ruta')
    return
  }

  await createMutation.mutateAsync({
    idUsuarioAuditoria: userId,
    fecha: fecha.value,
    idAlmacen: Number(idAlmacen.value),
    idChofer: idChofer.value ? Number(idChofer.value) : undefined,
    observacion: observacion.value.trim() || undefined,
    detalles: detalles.map(({ idBalon, lbSalida }) => ({ idBalon, lbSalida })),
  })
  open.value = false
  emit('saved')
}
</script>
