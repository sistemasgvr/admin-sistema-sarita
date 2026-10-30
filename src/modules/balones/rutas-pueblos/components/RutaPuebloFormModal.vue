<template>
  <AppModal
    v-model="open"
    title="Nueva ruta pueblos"
    subtitle="Ingresa las libras y los m³ de cada cilindro. El stock se descuenta al iniciar la ruta."
    size="lg"
  >
    <div class="space-y-4">
      <div data-tutorial="ruta-datos" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppDatePicker v-model="fecha" label="Fecha" required />
        <AlmacenSelectField v-model="idAlmacen" searchable required />
        <AppSelect
          v-model="idChofer"
          label="Chofer / repartidor"
          placeholder="Opcional"
          :options="choferOptions"
          :loading="choferesQuery.isFetching.value"
        />
        <AppInput v-model="observacion" label="Observación" placeholder="Zona, pueblos, etc." />
      </div>

      <!-- Sección de Cilindros -->
      <div data-tutorial="ruta-cilindros" class="space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Cilindros a enviar</p>
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
          class="grid grid-cols-[minmax(0,1fr)_40px] items-end gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] md:grid-cols-[minmax(0,1fr)_140px_150px_40px] dark:border-gray-800"
        >
          <div class="col-span-2 min-w-0 sm:col-span-3 md:col-span-1">
            <PosBalonSelectField
              v-model="linea.idBalon"
              mode="general"
              label="Cilindro"
              :id-almacen="idAlmacen"
              :extra-filters="balonExtraFilters"
              :client-filter="filtroBalonLinea(linea)"
              :selection-locked="!idAlmacen"
              :empty-text="
                idAlmacen
                  ? 'Sin cilindros disponibles (en almacén o ya agregados).'
                  : 'Selecciona el almacén primero.'
              "
              required
              @selected="(balon) => onBalonSelected(linea, balon)"
            />
          </div>
          <AppInput
            v-model="linea.lbSalida"
            class="col-span-2 min-w-0 sm:col-span-1"
            label="Libras de salida"
            type="number"
            step="0.01"
            min="0"
            required
          />
          <AppInput
            v-model="linea.m3Salida"
            class="min-w-0"
            label="m³ de salida"
            help="Cantidad manual para el stock"
            type="number"
            step="0.0001"
            min="0"
            required
          />
          <button
            type="button"
            class="inline-flex h-11 w-10 items-center justify-center self-end rounded-lg border border-gray-300 text-error-500"
            title="Quitar"
            @click="lineas.splice(index, 1)"
          >
            <AppIcon :name="ICONS.trash" :size="16" />
          </button>
        </div>
      </div>

      <!-- Sección de Productos -->
      <div data-tutorial="ruta-productos" class="space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Productos a enviar</p>
          <button
            type="button"
            class="text-xs font-medium text-brand-600 hover:underline"
            @click="addLineaProducto"
          >
            + Añadir producto
          </button>
        </div>
        <div
          v-if="lineasProducto.length === 0"
          class="rounded-lg border border-dashed border-gray-300 px-4 py-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          Opcional: agrega productos para enviar en la ruta.
        </div>
        <div
          v-for="(linea, index) in lineasProducto"
          :key="linea.key"
          class="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_100px_auto] dark:border-gray-800"
        >
          <AppSelectSearch
            v-model="linea.idProducto"
            v-model:search="linea.buscar"
            label="Producto"
            placeholder="Buscar producto..."
            search-placeholder="Código o nombre..."
            :options="filtroProductoOpciones(linea.key)"
            :loading="productosQuery.isFetching.value"
            :disabled="!idAlmacen"
            required
          />
          <AppInput
            v-model="linea.cantidad"
            label="Cantidad"
            type="number"
            step="0.01"
            min="0.01"
            required
          />
          <button
            type="button"
            class="mt-6 inline-flex h-10 w-10 items-center justify-center self-start rounded-lg border border-gray-300 text-error-500"
            title="Quitar"
            @click="lineasProducto.splice(index, 1)"
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
        data-tutorial="ruta-guardar"
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
import { useChoferesQuery } from '@/modules/choferes/composables/useChoferesQuery'
import type { ChoferListFilters } from '@/modules/choferes/interfaces/chofer.interface'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import { useCreateRutaPuebloMutation } from '@/modules/balones/rutas-pueblos/composables/useRutasPueblosMutations'
import { AppDatePicker, AppInput, AppModal, AppSelect, AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { toastWarning } from '@/shared/composables/useToast'
import { hoyIsoLima } from '@/shared/utils/date'
import { useProductosCatalogoQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { ProductoListFilters } from '@/modules/productos/articulos/interfaces/producto.interface'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const createMutation = useCreateRutaPuebloMutation()
const estadoBalonQuery = useListaOpcionesQuery(ref(ListaIds.ESTADO_BALON))

const fecha = ref(hoyIsoLima())
const idAlmacen = ref<number | ''>('')
const idChofer = ref<number | ''>('')
const observacion = ref('')
const choferesFilters = ref<ChoferListFilters>({
  pagina: 1,
  limite: 100,
  isActivos: 1,
  idCliente: -1,
})
const choferesQuery = useChoferesQuery(choferesFilters, open)
const choferOptions = computed(() =>
  (choferesQuery.data.value?.data ?? []).map((c) => ({
    value: c.id,
    label: [c.nombres, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' '),
  })),
)

// Productos
const productosFilters = ref<ProductoListFilters>({ pagina: 1, limite: 200 })
const productosQuery = useProductosCatalogoQuery(productosFilters)

const productoOptionsAll = computed(() =>
  (productosQuery.data.value?.data ?? [])
    .filter((p) => p.afecta_stock && p.estado === 1)
    .map((p) => ({
      value: p.id,
      label: `${p.codigo ?? ''} — ${p.nombre}`,
    })),
)

type LineaBalon = {
  key: string
  idBalon: number | ''
  /** Último cilindro para el que se inicializó la línea (evita borrar lo digitado). */
  ultimoBalonId: number | null
  lbSalida: string
  m3Salida: string
}

type LineaProducto = {
  key: string
  idProducto: number | ''
  cantidad: string
  buscar: string
}

function emptyLinea(): LineaBalon {
  return {
    key: crypto.randomUUID(),
    idBalon: '',
    ultimoBalonId: null,
    lbSalida: '',
    m3Salida: '',
  }
}

function emptyLineaProducto(): LineaProducto {
  return {
    key: crypto.randomUUID(),
    idProducto: '',
    cantidad: '',
    buscar: '',
  }
}

const lineas = ref<LineaBalon[]>([emptyLinea()])
const lineasProducto = ref<LineaProducto[]>([])

const estadoEnAlmacenId = computed(
  () => estadoBalonQuery.data.value?.find((item) => item.nombre === 'DISPONIBLE')?.id,
)

/** Solo cilindros DISPONIBLE del almacén elegido (no prestados / en ruta / recarga, etc.). */
const balonExtraFilters = computed<Partial<BalonListFilters>>(() => {
  const filters: Partial<BalonListFilters> = { soloBajas: false }
  if (estadoEnAlmacenId.value) filters.idEstadoBalon = estadoEnAlmacenId.value
  if (idAlmacen.value) filters.idAlmacen = Number(idAlmacen.value)
  return filters
})

function soloBalonEnviable(balon: Balon) {
  const estado = (balon.nombre_estado_balon ?? '').trim().toUpperCase()
  if (estado !== 'DISPONIBLE') return false
  if (idAlmacen.value && Number(balon.id_almacen) !== Number(idAlmacen.value)) return false
  return true
}

/**
 * Filtro estable por línea. Si se devuelve una función nueva en cada render,
 * el select de balones se recalcula y reemite `selected`, borrando lo digitado
 * en "Libras al salir".
 */
const filtrosBalonPorLinea = new WeakMap<LineaBalon, (balon: Balon) => boolean>()

/** Excluye cilindros ya elegidos en otras líneas (evita duplicar el mismo código). */
function filtroBalonLinea(linea: LineaBalon) {
  let filtro = filtrosBalonPorLinea.get(linea)
  if (!filtro) {
    filtro = (balon: Balon) => {
      if (!soloBalonEnviable(balon)) return false
      const idsOcupados = new Set(
        lineas.value
          .filter((l) => l.key !== linea.key && l.idBalon)
          .map((l) => Number(l.idBalon)),
      )
      return !idsOcupados.has(balon.id)
    }
    filtrosBalonPorLinea.set(linea, filtro)
  }
  return filtro
}

/** Excluye productos ya elegidos en otras líneas */
function filtroProductoOpciones(lineaKey: string) {
  const idsOcupados = new Set(
    lineasProducto.value
      .filter((l) => l.key !== lineaKey && l.idProducto)
      .map((l) => Number(l.idProducto)),
  )
  return productoOptionsAll.value.filter((opt) => !idsOcupados.has(opt.value))
}

function onBalonSelected(linea: LineaBalon, balon: Balon | null) {
  const id = balon?.id ?? null
  if (linea.ultimoBalonId !== id) {
    linea.lbSalida = ''
    linea.m3Salida = ''
  }
  linea.ultimoBalonId = id
}

function lbSalidaValida(value: string) {
  if (value === '') return false
  const n = Number(value)
  return Number.isFinite(n) && n >= 0
}

const saving = computed(() => createMutation.isPending.value)
const canSave = computed(
  () =>
    Boolean(idAlmacen.value) &&
    (lineas.value.some((l) => l.idBalon && lbSalidaValida(l.lbSalida) && lbSalidaValida(l.m3Salida)) ||
      lineasProducto.value.some((l) => l.idProducto && Number(l.cantidad) > 0)),
)

function addLinea() {
  lineas.value.push(emptyLinea())
}

function addLineaProducto() {
  lineasProducto.value.push(emptyLineaProducto())
}

watch(idAlmacen, () => {
  for (const linea of lineas.value) {
    linea.idBalon = ''
    linea.ultimoBalonId = null
    linea.lbSalida = ''
    linea.m3Salida = ''
  }
  for (const linea of lineasProducto.value) {
    linea.idProducto = ''
    linea.cantidad = ''
  }
})

watch(open, (v) => {
  if (!v) return
  fecha.value = hoyIsoLima()
  idAlmacen.value = ''
  idChofer.value = ''
  observacion.value = ''
  lineas.value = [emptyLinea()]
  lineasProducto.value = []
})

async function guardar() {
  const userId = authStore.user?.id
  if (!userId || !idAlmacen.value) return

  if (lineas.value.some(l => l.idBalon && (!lbSalidaValida(l.lbSalida) || !lbSalidaValida(l.m3Salida)))) {
    toastWarning('Completa las libras y los m³ de salida (≥ 0) de cada cilindro')
    return
  }

  const detalles = lineas.value
    .filter((l) => l.idBalon)
    .map((l) => ({
      idBalon: Number(l.idBalon),
      lbSalida: Number(l.lbSalida),
      m3Salida: Number(l.m3Salida),
    }))

  const detallesProductos = lineasProducto.value
    .filter((l) => l.idProducto && Number(l.cantidad) > 0)
    .map((l) => ({
      idProducto: Number(l.idProducto),
      cantidad: Number(l.cantidad),
    }))

  if (detalles.length === 0 && detallesProductos.length === 0) {
    toastWarning('Agrega al menos un cilindro o un producto')
    return
  }

  if (detalles.some((d) => !lbSalidaValida(String(d.lbSalida)) || Number.isNaN(d.lbSalida))) {
    toastWarning('Completa las libras de salida (≥ 0) de los cilindros')
    return
  }

  const ids = detalles.map((d) => d.idBalon)
  if (new Set(ids).size !== ids.length) {
    toastWarning('Hay cilindros duplicados en la ruta')
    return
  }

  const idsProd = detallesProductos.map((d) => d.idProducto)
  if (new Set(idsProd).size !== idsProd.length) {
    toastWarning('Hay productos duplicados en la ruta')
    return
  }

  await createMutation.mutateAsync({
    idUsuarioAuditoria: userId,
    idUsuarioResponsable: userId,
    fecha: fecha.value,
    idAlmacen: Number(idAlmacen.value),
    idChofer: idChofer.value ? Number(idChofer.value) : undefined,
    observacion: observacion.value.trim() || undefined,
    detalles: detalles.length > 0
      ? detalles.map(({ idBalon, lbSalida, m3Salida }) => ({ idBalon, lbSalida, m3Salida }))
      : undefined,
    detallesProductos: detallesProductos.length > 0 ? detallesProductos : undefined,
  })
  open.value = false
  emit('saved')
}
</script>
