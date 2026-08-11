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
              text="La conversión lb / m³ se toma del tipo de cada cilindro (capacidad m³ / capacidad lb). La tolerancia de cierre viene de Configuración / Empresa."
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
          class="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_120px_auto] dark:border-gray-800"
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
          />
          <AppInput
            v-model="linea.lbSalida"
            label="Libras al salir"
            type="number"
            step="0.01"
            min="0"
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

type Linea = { key: string; idBalon: number | ''; lbSalida: string }
const lineas = ref<Linea[]>([{ key: crypto.randomUUID(), idBalon: '', lbSalida: '' }])

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
  // Dependencia explícita: al cambiar selecciones se regenera el filtro.
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

const saving = computed(() => createMutation.isPending.value)
const canSave = computed(
  () =>
    Boolean(idAlmacen.value) &&
    lineas.value.some((l) => l.idBalon && Number(l.lbSalida) >= 0),
)

function addLinea() {
  lineas.value.push({ key: crypto.randomUUID(), idBalon: '', lbSalida: '' })
}

watch(idAlmacen, () => {
  for (const linea of lineas.value) {
    linea.idBalon = ''
  }
})

async function loadChoferes() {
  choferesLoading.value = true
  try {
    // Solo flota propia de la empresa (Configuración / Choferes).
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
  lineas.value = [{ key: crypto.randomUUID(), idBalon: '', lbSalida: '' }]
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
    }))

  if (detalles.length === 0) {
    toastWarning('Agrega al menos un cilindro')
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
    detalles,
  })
  open.value = false
  emit('saved')
}
</script>
