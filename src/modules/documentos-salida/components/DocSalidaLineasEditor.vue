<template>
  <div class="space-y-5">
    <!-- Agregar una línea nueva -->
    <div v-if="!readonly" class="rounded-xl border border-gray-200 p-3.5 dark:border-gray-700">
      <div class="mb-3 flex gap-2 text-sm">
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 transition"
          :class="modo === 'PRODUCTO' ? 'bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10' : 'text-gray-500 hover:text-gray-700'"
          @click="modo = 'PRODUCTO'"
        >
          Producto
        </button>
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 transition"
          :class="modo === 'BALON' ? 'bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10' : 'text-gray-500 hover:text-gray-700'"
          @click="modo = 'BALON'"
        >
          Balón
        </button>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <template v-if="modo === 'PRODUCTO'">
          <ProductoSelectField
            v-model="idProducto"
            label=""
            :placeholder="idAlmacen ? 'Buscar producto...' : 'Elige un almacén primero'"
            class="sm:col-span-2"
            :id-almacen="idAlmacen ?? null"
            :excluir-ids="[...idsProductoUsados]"
            bloquear-sin-stock
            :disabled="disabled || !idAlmacen"
          />
          <AppInput
            v-model.number="cantidad"
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="Cantidad"
            :disabled="disabled"
          />
        </template>

        <!--
          El balón no lleva cantidad: es un envase con identidad, va de a uno.
          Para despachar dos cilindros se agregan dos líneas.
        -->
        <AppSelectSearch
          v-else
          v-model="idBalon"
          v-model:search="balonSearch"
          remote
          :placeholder="idAlmacen ? 'Buscar balón disponible por código...' : 'Elige un almacén primero'"
          :options="balonOptions"
          :loading="balonesQuery.isFetching.value"
          :disabled="disabled || !idAlmacen"
          class="sm:col-span-3"
        />

        <AppInput v-model="glosa" placeholder="Glosa (opcional)" :disabled="disabled" />
      </div>

      <p v-if="!idAlmacen" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Selecciona el almacén de la orden: solo se ofrecen productos con stock y balones
        disponibles en ese almacén.
      </p>

      <button
        v-else
        type="button"
        class="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="!puedeAgregar || disabled"
        @click="onAgregar"
      >
        <AppIcon :name="ICONS.plus" :size="15" />
        Agregar {{ modo === 'BALON' ? 'balón' : 'producto' }}
      </button>
    </div>

    <!-- Listas separadas: productos y balones se leen distinto -->
    <section v-for="grupo in grupos" :key="grupo.tipo">
      <div class="mb-2 flex items-center gap-2">
        <AppIcon
          :name="grupo.tipo === 'BALON' ? ICONS.cylinder : ICONS.package"
          :size="14"
          class="text-gray-400"
        />
        <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {{ grupo.titulo }}
        </h4>
        <span class="text-xs text-gray-400">{{ grupo.lineas.length }}</span>
      </div>

      <div v-if="grupo.lineas.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="linea in grupo.lineas"
          :key="linea.key"
          class="rounded-xl border border-gray-200 bg-white p-3.5 shadow-theme-xs transition hover:border-brand-300 dark:border-gray-700 dark:bg-white/[0.02]"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
              :class="
                linea.tipo === 'BALON'
                  ? 'border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300'
              "
            >
              <AppIcon :name="linea.tipo === 'BALON' ? ICONS.cylinder : ICONS.package" :size="17" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                {{ linea.titulo }}
              </p>
              <div v-if="linea.badge || linea.subtitulo" class="mt-1 flex flex-wrap items-center gap-1.5">
                <AppBadge v-if="linea.badge" size="sm" variant="light" :color="linea.badge.color">
                  {{ linea.badge.texto }}
                </AppBadge>
                <span
                  v-if="linea.subtitulo"
                  class="truncate text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ linea.subtitulo }}
                </span>
              </div>
              <p
                v-if="mostrarCantidad(linea)"
                class="mt-1.5 text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                {{ linea.cantidad }}
                <span v-if="linea.unidad" class="font-normal text-gray-400">{{ linea.unidad }}</span>
              </p>
              <p v-if="linea.glosa" class="mt-1 truncate text-xs italic text-gray-400">
                {{ linea.glosa }}
              </p>
            </div>

            <button
              v-if="linea.removible && !readonly"
              type="button"
              title="Quitar línea"
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:border-error-300 hover:bg-error-50 hover:text-error-600 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-error-500/10"
              :disabled="disabled"
              @click="emit('quitar', linea.key)"
            >
              <AppIcon :name="ICONS.x" :size="14" />
            </button>
          </div>
        </article>
      </div>

      <p
        v-else
        class="rounded-xl border border-dashed border-gray-300 py-5 text-center text-xs text-gray-400 dark:border-gray-700"
      >
        {{ grupo.vacio }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { esBalonEntregable } from '@/modules/balones/cilindros/utils/disponibilidadBalon'
import type { BalonListFilters } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import { useProductoDetailQuery } from '@/modules/productos/articulos/composables/useProductoDetailQuery'
import type {
  DocSalidaLineaBorrador,
  DocSalidaLineaCard,
} from '@/modules/documentos-salida/interfaces/documento-salida.interface'
import { AppBadge, AppInput, AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'

const props = withDefaults(
  defineProps<{
    lineas: DocSalidaLineaCard[]
    /**
     * Almacén de la orden. Acota lo que se puede despachar: productos con stock
     * ahí y balones disponibles ahí. Sin almacén no se ofrece nada.
     */
    idAlmacen?: number | null
    /** true mientras una mutación está en vuelo. */
    disabled?: boolean
    /** El documento ya no admite cambios (generado, anulado, o detalle de venta). */
    readonly?: boolean
    vacioProductos?: string
    vacioBalones?: string
  }>(),
  {
    idAlmacen: null,
    disabled: false,
    readonly: false,
    vacioProductos: 'Sin productos',
    vacioBalones: 'Sin balones',
  },
)

const emit = defineEmits<{
  agregar: [linea: DocSalidaLineaBorrador]
  quitar: [key: string]
}>()

const grupos = computed(() => [
  {
    tipo: 'PRODUCTO' as const,
    titulo: 'Productos',
    vacio: props.vacioProductos,
    lineas: props.lineas.filter((linea) => linea.tipo === 'PRODUCTO'),
  },
  {
    tipo: 'BALON' as const,
    titulo: 'Balones',
    vacio: props.vacioBalones,
    lineas: props.lineas.filter((linea) => linea.tipo === 'BALON'),
  },
])

/**
 * Un balón suelto siempre es 1: mostrar "1" en la card es ruido. Se muestra
 * cuando el número dice algo — un producto, o un balón que además lleva gas
 * (el detalle de recarga en planta trae balón, producto y m³ en la misma línea).
 */
function mostrarCantidad(linea: DocSalidaLineaCard) {
  if (linea.tipo === 'PRODUCTO') return true
  return linea.cantidad !== 1 || Boolean(linea.unidad)
}

const modo = ref<'PRODUCTO' | 'BALON'>('PRODUCTO')
const idProducto = ref<number | ''>('')
const idBalon = ref<number | ''>('')
const cantidad = ref<number | ''>('')
const glosa = ref('')

// El detalle del producto se pide para poder pintar la card antes de que el
// documento exista: en creación no hay doc_salida_detalle de donde leer nada.
const idProductoRef = computed(() =>
  idProducto.value === '' ? undefined : Number(idProducto.value),
)
const productoQuery = useProductoDetailQuery(idProductoRef)

const balonSearch = ref('')

// El catálogo da el id de la opción DISPONIBLE; el filtro del listado es por id,
// no por nombre.
const listaEstadoBalonId = ref(ListaIds.ESTADO_BALON)
const estadoBalonQuery = useListaOpcionesQuery(listaEstadoBalonId)
const idEstadoDisponible = computed(
  () => estadoBalonQuery.data.value?.find((opcion) => opcion.nombre === 'DISPONIBLE')?.id,
)

const balonesFiltros = ref<BalonListFilters>({ pagina: 1, limite: 20 })

watch(
  [balonSearch, () => props.idAlmacen, idEstadoDisponible],
  ([term, idAlmacen, idEstado]) => {
    balonesFiltros.value = {
      pagina: 1,
      limite: 20,
      buscar: term.trim() || undefined,
      idAlmacen: idAlmacen ?? undefined,
      idEstadoBalon: idEstado,
    }
  },
  { immediate: true },
)

const balonesQuery = useBalonesQuery(balonesFiltros)

// Segundo filtro en el cliente: es la MISMA regla que usa el POS. El estado y el
// almacén pueden contradecirse (edición manual del cilindro) y ahí el listado
// devolvería un balón que en realidad no está.
const balones = computed(() =>
  (balonesQuery.data.value?.data ?? []).filter(
    (balon) => props.idAlmacen != null && esBalonEntregable(balon),
  ),
)

// Lo que ya está en el detalle no se vuelve a ofrecer: un cilindro no se
// despacha dos veces en la misma orden, y repetir un producto es casi siempre
// un error de tipeo.
const idsBalonUsados = computed(
  () => new Set(props.lineas.map((linea) => linea.idBalon).filter((id): id is number => id != null)),
)

const idsProductoUsados = computed(
  () =>
    new Set(props.lineas.map((linea) => linea.idProducto).filter((id): id is number => id != null)),
)

const balonOptions = computed(() =>
  balones.value
    .filter((balon) => !idsBalonUsados.value.has(balon.id))
    .map((balon) => ({
      value: balon.id,
      label: balon.codigo_balon,
      title: [balon.codigo_balon, balon.nombre_tipo_balon, balon.nombre_almacen]
        .filter(Boolean)
        .join(' · '),
    })),
)

const puedeAgregar = computed(() => {
  if (modo.value === 'BALON') return idBalon.value !== ''
  return idProducto.value !== '' && Boolean(cantidad.value) && Number(cantidad.value) > 0
})

function limpiar() {
  idProducto.value = ''
  idBalon.value = ''
  cantidad.value = ''
  glosa.value = ''
  balonSearch.value = ''
}

function onAgregar() {
  if (!puedeAgregar.value) return

  const glosaLimpia = glosa.value.trim() || undefined

  if (modo.value === 'PRODUCTO') {
    const producto = productoQuery.data.value
    emit('agregar', {
      idProducto: Number(idProducto.value),
      cantidad: Number(cantidad.value),
      glosa: glosaLimpia,
      nombreProducto: producto?.nombre,
      codigoProducto: producto?.codigo,
      nombreUnidadMedida: producto?.nombre_unidad_medida,
    })
  } else {
    const balon = balones.value.find((b) => b.id === Number(idBalon.value))
    emit('agregar', {
      idBalon: Number(idBalon.value),
      // Un cilindro es una unidad física: la línea siempre vale 1.
      cantidad: 1,
      glosa: glosaLimpia,
      codigoBalon: balon?.codigo_balon,
      nombreTipoBalon: balon?.nombre_tipo_balon ?? undefined,
      nombreAlmacenBalon: balon?.nombre_almacen ?? undefined,
    })
  }

  limpiar()
}
</script>
