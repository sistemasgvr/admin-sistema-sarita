<template>
  <div class="space-y-5">
    <!-- ============ 1. Balones ============ -->
    <section class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <header
        class="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/75 px-4 py-2.5 dark:border-gray-700 dark:bg-white/[0.02]"
      >
        <AppIcon :name="ICONS.cylinder" :size="14" class="text-gray-400" />
        <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Balones
        </h4>
        <span class="text-xs text-gray-400">{{ balones.length }}</span>
      </header>

      <div v-if="!readonly" class="border-b border-gray-100 p-3.5 dark:border-gray-700">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AppSelectSearch
            v-model="idBalon"
            v-model:search="balonSearch"
            remote
            :placeholder="
              idAlmacen ? 'Buscar balón disponible por código...' : 'Elige un almacén primero'
            "
            :options="balonOptions"
            :loading="balonesQuery.isFetching.value"
            :disabled="disabled || !idAlmacen"
            class="sm:col-span-2"
          />
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="!idBalon || disabled"
            @click="onAgregarBalon"
          >
            <AppIcon :name="ICONS.plus" :size="14" />
            Agregar balón
          </button>
        </div>

        <p
          v-if="balonSeleccionado"
          class="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
        >
          <AppIcon :name="ICONS.info" :size="13" class="text-brand-500" />
          <strong class="text-gray-700 dark:text-gray-300">{{
            balonSeleccionado.codigo_balon
          }}</strong>
          <span>·</span>
          <span>{{ balonSeleccionado.nombre_tipo_balon ?? 'Sin tipo' }}</span>
          <span>·</span>
          <span v-if="balonSeleccionado.nombre_producto_gas">
            carga
            <strong class="text-gray-700 dark:text-gray-300">{{
              balonSeleccionado.nombre_producto_gas
            }}</strong>
            <template v-if="Number(balonSeleccionado.capacidad) > 0">
              ({{ formatCantidad(balonSeleccionado.capacidad) }}
              {{ balonSeleccionado.nombre_unidad_medida }})
            </template>
          </span>
          <span v-else class="text-warning-600 dark:text-warning-400">sin gas asociado</span>
        </p>

        <p v-if="!idAlmacen" class="mt-2.5 text-xs text-gray-500 dark:text-gray-400">
          Selecciona el almacén de la orden: solo se ofrecen balones disponibles en ese almacén.
        </p>
      </div>

      <div v-if="balones.length" class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead
            class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"
          >
            <tr>
              <th class="px-4 py-2 font-medium">Cilindro</th>
              <th class="px-4 py-2 font-medium">Tipo</th>
              <th class="px-4 py-2 font-medium">Gas que carga</th>
              <th v-if="!readonly" class="w-12 px-4 py-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="linea in balones"
              :key="linea.key"
              class="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
            >
              <td class="px-4 py-2">
                <p class="font-medium text-gray-800 dark:text-white/90">
                  {{ linea.codigoBalon ?? '—' }}
                </p>
                <p
                  v-if="linea.nombreAlmacenBalon"
                  class="truncate text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ linea.nombreAlmacenBalon }}
                </p>
              </td>
              <td class="px-4 py-2">
                <AppBadge
                  v-if="linea.nombreTipoBalon"
                  size="sm"
                  variant="light"
                  :color="tipoBalonBadgeColor(linea.nombreTipoBalon)"
                >
                  {{ linea.nombreTipoBalon }}
                </AppBadge>
                <span v-else class="text-xs text-gray-400">Sin tipo</span>
              </td>
              <td class="px-4 py-2">
                <template v-if="linea.nombreProductoGas || linea.nombreProducto">
                  <span class="text-gray-700 dark:text-gray-300">
                    {{ linea.nombreProductoGas ?? linea.nombreProducto }}
                  </span>
                  <!--
                    El detalle de una venta trae líneas con balón Y producto: el
                    gas que se despachó en ese cilindro. Ahí la cantidad es del
                    documento, no la capacidad del tipo, y hay que mostrarla.
                  -->
                  <span
                    v-if="linea.idProducto != null"
                    class="ml-1 text-xs font-medium text-gray-600 dark:text-gray-300"
                  >
                    · {{ formatCantidad(linea.cantidad) }}
                    {{ linea.nombreUnidadMedida ?? '' }}
                  </span>
                  <span
                    v-else-if="Number(linea.capacidadBalon) > 0"
                    class="ml-1 text-xs text-gray-400"
                  >
                    · cap. {{ formatCantidad(linea.capacidadBalon) }}
                    {{ linea.unidadCapacidadBalon }}
                  </span>
                </template>
                <span v-else class="text-xs text-warning-600 dark:text-warning-400">
                  Sin gas asociado
                </span>
              </td>
              <td v-if="!readonly" class="px-4 py-2 text-right">
                <button
                  v-if="linea.removible"
                  type="button"
                  title="Quitar balón"
                  class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:border-error-300 hover:bg-error-50 hover:text-error-600 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-error-500/10"
                  :disabled="disabled"
                  @click="emit('quitar', linea.key)"
                >
                  <AppIcon :name="ICONS.x" :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="px-4 py-6 text-center text-xs text-gray-400">{{ vacioBalones }}</p>
    </section>

    <!-- ============ 2. Productos derivados de los balones ============ -->
    <section
      v-if="balones.length"
      class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
    >
      <header
        class="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/75 px-4 py-2.5 dark:border-gray-700 dark:bg-white/[0.02]"
      >
        <AppIcon :name="ICONS.flame" :size="14" class="text-gray-400" />
        <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Productos según los balones
        </h4>
        <span class="ml-auto text-[11px] font-normal normal-case text-gray-400">
          Cantidad total que sale, no una por cilindro
        </span>
      </header>

      <div v-if="gruposGas.length" class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead
            class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"
          >
            <tr>
              <th class="px-4 py-2 font-medium">Producto</th>
              <th class="px-4 py-2 font-medium">Tipos que lo cargan</th>
              <th class="w-60 px-4 py-2 font-medium">Cantidad a salir</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="grupo in gruposGas"
              :key="grupo.idProducto"
              class="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
            >
              <td class="px-4 py-2.5">
                <p class="font-medium text-gray-800 dark:text-white/90">{{ grupo.nombre }}</p>
                <p class="text-xs text-gray-400">
                  {{ grupo.balones }} balón{{ grupo.balones === 1 ? '' : 'es' }}
                </p>
              </td>
              <td class="px-4 py-2.5">
                <div class="flex flex-wrap gap-1">
                  <AppBadge
                    v-for="tipo in grupo.tipos"
                    :key="tipo.nombre"
                    size="sm"
                    variant="light"
                    :color="tipoBalonBadgeColor(tipo.nombre)"
                  >
                    {{ tipo.nombre }} ×{{ tipo.cantidad }}
                  </AppBadge>
                </div>
              </td>
              <td class="px-4 py-2.5">
                <CantidadProductoInput
                  :model-value="cantidades[grupo.idProducto] ?? ''"
                  :unidad="grupo.unidad"
                  :stock="stockDe(grupo.idProducto)"
                  :capacidad="grupo.capacidadTotal || null"
                  :disabled="disabled"
                  :readonly="readonly"
                  @update:model-value="cantidades[grupo.idProducto] = $event"
                  @focus="editando = grupo.idProducto"
                  @commit="onCommitProducto(grupo.idProducto)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="px-4 py-5 text-center text-xs text-gray-400">
        Los balones agregados no tienen un gas asociado, así que no hay productos que cargar.
      </p>

      <p
        v-if="balonesSinGas.length"
        class="flex items-start gap-2 border-t border-gray-100 bg-warning-50/60 px-4 py-2.5 text-xs text-warning-700 dark:border-gray-700 dark:bg-warning-500/10 dark:text-warning-400"
      >
        <AppIcon :name="ICONS.alertTriangle" :size="14" class="mt-0.5 shrink-0" />
        <span>
          Sin gas asociado, no generan fila de cantidad:
          <strong>{{ balonesSinGas.map((b) => b.codigoBalon).join(', ') }}</strong
          >. Asígnales su gas en la ficha del cilindro{{
            permitirOtrosProductos ? ', o declara el producto abajo a mano' : ''
          }}.
        </span>
      </p>
    </section>

    <!-- ============ 3. Otros productos ============ -->
    <!--
      En planta externa no existe: lo que va a recargar son los cilindros y su
      gas. Permitir productos sueltos ahí solo invita a mandar a la planta cosas
      que no tienen nada que ver con la recarga.
    -->
    <section
      v-if="permitirOtrosProductos"
      class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
    >
      <header
        class="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/75 px-4 py-2.5 dark:border-gray-700 dark:bg-white/[0.02]"
      >
        <AppIcon :name="ICONS.package" :size="14" class="text-gray-400" />
        <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Otros productos
        </h4>
        <span class="text-xs text-gray-400">{{ productosManuales.length }}</span>
        <span class="ml-auto text-[11px] font-normal normal-case text-gray-400">
          Los que no vienen de los balones de arriba
        </span>
      </header>

      <div v-if="!readonly" class="border-b border-gray-100 p-3.5 dark:border-gray-700">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <ProductoSelectField
            v-model="idProductoManual"
            label=""
            :placeholder="idAlmacen ? 'Buscar producto...' : 'Elige un almacén primero'"
            class="sm:col-span-2"
            :id-almacen="idAlmacen ?? null"
            :excluir-ids="[...idsProductoUsados]"
            bloquear-sin-stock
            :disabled="disabled || !idAlmacen"
          />
          <!--
            Sin `@commit`: acá la fila se agrega con el botón. Guardar al salir
            del campo haría aparecer una línea solo por mover el foco.
          -->
          <CantidadProductoInput
            v-model="cantidadManual"
            :unidad="unidadManual"
            :stock="idProductoManual === '' ? null : stockDe(Number(idProductoManual))"
            :capacidad="null"
            :disabled="disabled || idProductoManual === ''"
          />
          <button
            type="button"
            class="inline-flex h-fit items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="!puedeAgregarManual || disabled"
            @click="onAgregarProductoManual"
          >
            <AppIcon :name="ICONS.plus" :size="14" />
            Agregar otro producto
          </button>
        </div>
      </div>

      <div v-if="productosManuales.length" class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead
            class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"
          >
            <tr>
              <th class="px-4 py-2 font-medium">Producto</th>
              <th class="w-60 px-4 py-2 font-medium">Cantidad a salir</th>
              <th v-if="!readonly" class="w-12 px-4 py-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="linea in productosManuales"
              :key="linea.key"
              class="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
            >
              <td class="px-4 py-2.5">
                <p class="font-medium text-gray-800 dark:text-white/90">
                  {{ linea.nombreProducto ?? 'Producto' }}
                </p>
                <p v-if="linea.codigoProducto" class="text-xs text-gray-400">
                  {{ linea.codigoProducto }}
                </p>
                <p v-if="linea.glosa" class="truncate text-xs italic text-gray-400">
                  {{ linea.glosa }}
                </p>
              </td>
              <td class="px-4 py-2.5">
                <CantidadProductoInput
                  v-if="linea.idProducto != null"
                  :model-value="cantidades[linea.idProducto] ?? ''"
                  :unidad="linea.nombreUnidadMedida ?? undefined"
                  :stock="stockDe(linea.idProducto)"
                  :capacidad="null"
                  :disabled="disabled"
                  :readonly="readonly"
                  @update:model-value="cantidades[linea.idProducto!] = $event"
                  @focus="editando = linea.idProducto"
                  @commit="onCommitProducto(linea.idProducto!)"
                />
              </td>
              <td v-if="!readonly" class="px-4 py-2.5 text-right">
                <button
                  v-if="linea.removible"
                  type="button"
                  title="Quitar producto"
                  class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:border-error-300 hover:bg-error-50 hover:text-error-600 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-error-500/10"
                  :disabled="disabled"
                  @click="emit('quitar', linea.key)"
                >
                  <AppIcon :name="ICONS.x" :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="px-4 py-5 text-center text-xs text-gray-400">
        {{ vacioProductos }}
      </p>
    </section>

    <!-- ============ 4. Resumen ============ -->
    <section
      v-if="balones.length || productosConCantidad.length"
      class="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-white/[0.02]"
    >
      <header
        class="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-gray-700"
      >
        <AppIcon :name="ICONS.clipboardList" :size="14" class="text-gray-400" />
        <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Resumen
        </h4>
      </header>

      <div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
        <div>
          <span class="block text-[11px] uppercase tracking-wider text-gray-400">
            Balones seleccionados
          </span>
          <span class="text-lg font-bold tabular-nums text-gray-800 dark:text-white/90">
            {{ balones.length }}
          </span>
          <div class="mt-1 flex flex-wrap gap-1">
            <AppBadge
              v-for="tipo in resumenTipos"
              :key="tipo.nombre"
              size="sm"
              variant="light"
              :color="tipoBalonBadgeColor(tipo.nombre)"
            >
              {{ tipo.nombre }} ×{{ tipo.cantidad }}
            </AppBadge>
          </div>
        </div>

        <div>
          <span class="block text-[11px] uppercase tracking-wider text-gray-400">
            Productos registrados
          </span>
          <span class="text-lg font-bold tabular-nums text-gray-800 dark:text-white/90">
            {{ productosConCantidad.length }}
          </span>
        </div>

        <div>
          <span class="block text-[11px] uppercase tracking-wider text-gray-400">
            Total a salir
          </span>
          <!--
            Los productos no comparten unidad (acetileno en KG, el resto en MT3),
            así que una sola suma no significaría nada: se totaliza por unidad.
          -->
          <div v-if="totalesPorUnidad.length" class="flex flex-wrap items-baseline gap-x-3">
            <span
              v-for="total in totalesPorUnidad"
              :key="total.unidad"
              class="text-lg font-bold tabular-nums text-gray-800 dark:text-white/90"
            >
              {{ formatCantidad(total.cantidad) }}
              <span class="text-xs font-normal text-gray-400">{{ total.unidad }}</span>
            </span>
          </div>
          <span v-else class="text-lg font-bold text-gray-300 dark:text-gray-600">—</span>
        </div>
      </div>

      <ul
        v-if="productosConCantidad.length"
        class="divide-y divide-gray-200 border-t border-gray-100 text-sm dark:divide-gray-700 dark:border-gray-700"
      >
        <li
          v-for="linea in productosConCantidad"
          :key="linea.key"
          class="flex items-center justify-between gap-3 px-4 py-1.5"
        >
          <span class="truncate text-gray-600 dark:text-gray-400">
            {{ linea.nombreProducto ?? 'Producto' }}
          </span>
          <span class="shrink-0 font-medium tabular-nums text-gray-800 dark:text-white/90">
            {{ formatCantidad(linea.cantidad) }}
            <span class="text-xs font-normal text-gray-400">
              {{ linea.nombreUnidadMedida ?? 'und' }}
            </span>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { esBalonEntregable } from '@/modules/balones/cilindros/utils/disponibilidadBalon'
import type { BalonListFilters } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { tipoBalonBadgeColor } from '@/modules/balones/utils/tipoBalonBadge'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import CantidadProductoInput from '@/modules/documentos-salida/components/CantidadProductoInput.vue'
import type {
  DocSalidaLineaBorrador,
  DocSalidaDetalleLinea,
  DocSalidaProductoCantidad,
} from '@/modules/documentos-salida/interfaces/documento-salida.interface'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import { useStockQuery } from '@/modules/productos/stock/composables/useStockQuery'
import { AppBadge, AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'

const props = withDefaults(
  defineProps<{
    lineas: DocSalidaDetalleLinea[]
    /** Almacén de la orden: acota los balones disponibles y el stock. */
    idAlmacen?: number | null
    /**
     * En planta externa no: lo que sale son los cilindros y su gas. En el resto
     * de órdenes se puede despachar cualquier producto además de los balones.
     */
    permitirOtrosProductos?: boolean
    /** true mientras una mutación está en vuelo. */
    disabled?: boolean
    /** El documento ya no admite cambios (generado, anulado o detalle de venta). */
    readonly?: boolean
    vacioBalones?: string
    vacioProductos?: string
  }>(),
  {
    idAlmacen: null,
    permitirOtrosProductos: true,
    disabled: false,
    readonly: false,
    vacioBalones: 'Sin balones',
    vacioProductos: 'Sin productos adicionales.',
  },
)

const emit = defineEmits<{
  'agregar-balon': [linea: DocSalidaLineaBorrador]
  'set-producto': [producto: DocSalidaProductoCantidad]
  quitar: [key: string]
}>()

/** Hasta 4 decimales, sin ceros de relleno: 6.0000 se lee "6". */
function formatCantidad(valor: number | string | null | undefined) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return '0'
  return String(Number(n.toFixed(4)))
}

const balones = computed(() => props.lineas.filter((linea) => linea.tipo === 'BALON'))
const productos = computed(() => props.lineas.filter((linea) => linea.tipo === 'PRODUCTO'))

// ---- Stock en el almacén de la orden ----
// Se consulta el stock y no el catálogo de productos: cubre cualquier producto
// (gas o no) con una sola llamada, y solo trae los que tienen existencias en
// ESE almacén, que es justo el tope de la cantidad que puede salir.
const stockFiltros = computed(() => ({
  pagina: 1,
  limite: 500,
  idAlmacen: props.idAlmacen != null ? Number(props.idAlmacen) : undefined,
}))
const stockQuery = useStockQuery(stockFiltros, () => props.idAlmacen != null)

const stockPorProducto = computed(() => {
  const mapa = new Map<
    number,
    { stock: number; nombre: string; codigo?: string; unidad?: string }
  >()
  for (const fila of stockQuery.data.value?.data ?? []) {
    mapa.set(fila.id_producto, {
      stock: Number(fila.stock),
      nombre: fila.nombre_producto,
      codigo: fila.codigo_producto,
      unidad: fila.nombre_unidad_medida ?? undefined,
    })
  }
  return mapa
})

/** null = el producto no tiene registro de stock en este almacén. */
function stockDe(idProducto: number) {
  const fila = stockPorProducto.value.get(idProducto)
  return fila ? fila.stock : null
}

/**
 * Los productos que la orden debe declarar, derivados de los tipos de balón
 * agregados. Se agrupa por PRODUCTO y no por tipo: "Oxígeno Medicinal 6 m³" y
 * "Oxígeno Medicinal 10 m³" cargan el mismo gas, así que comparten una sola
 * fila de cantidad — la capacidad que topa esa fila es la suma de ambos.
 */
const gruposGas = computed(() => {
  const mapa = new Map<
    number,
    {
      idProducto: number
      nombre: string
      unidad?: string
      capacidadTotal: number
      balones: number
      tipos: { nombre: string; cantidad: number }[]
    }
  >()

  for (const linea of balones.value) {
    const idGas = linea.idProductoGas
    if (idGas == null) continue

    let grupo = mapa.get(idGas)
    if (!grupo) {
      grupo = {
        idProducto: idGas,
        nombre: linea.nombreProductoGas ?? stockPorProducto.value.get(idGas)?.nombre ?? 'Gas',
        unidad:
          stockPorProducto.value.get(idGas)?.unidad ?? linea.unidadCapacidadBalon ?? undefined,
        capacidadTotal: 0,
        balones: 0,
        tipos: [],
      }
      mapa.set(idGas, grupo)
    }

    grupo.balones += 1
    const capacidad = Number(linea.capacidadBalon ?? 0)
    if (Number.isFinite(capacidad) && capacidad > 0) grupo.capacidadTotal += capacidad

    const nombreTipo = linea.nombreTipoBalon ?? 'Sin tipo'
    const tipo = grupo.tipos.find((item) => item.nombre === nombreTipo)
    if (tipo) tipo.cantidad += 1
    else grupo.tipos.push({ nombre: nombreTipo, cantidad: 1 })
  }

  return [...mapa.values()]
})

const idsGasDerivado = computed(() => new Set(gruposGas.value.map((grupo) => grupo.idProducto)))

/** Balones que no declaran gas: no hay producto que derivar de ellos. */
const balonesSinGas = computed(() => balones.value.filter((linea) => linea.idProductoGas == null))

/** Líneas de producto que no salen de ningún balón: las agregadas a mano. */
const productosManuales = computed(() =>
  productos.value.filter(
    (linea) => linea.idProducto == null || !idsGasDerivado.value.has(linea.idProducto),
  ),
)

/**
 * Lo que el resumen cuenta como producto que sale. No basta con las filas de
 * tipo PRODUCTO: el detalle de una venta trae líneas con balón Y producto (el
 * gas despachado en ese cilindro), y esa cantidad también sale del almacén.
 */
const productosConCantidad = computed(() =>
  props.lineas.filter((linea) => linea.idProducto != null && Number(linea.cantidad) > 0),
)

const totalesPorUnidad = computed(() => {
  const mapa = new Map<string, number>()
  for (const linea of productosConCantidad.value) {
    const unidad = linea.nombreUnidadMedida ?? 'und'
    mapa.set(unidad, (mapa.get(unidad) ?? 0) + Number(linea.cantidad))
  }
  return [...mapa.entries()].map(([unidad, cantidad]) => ({ unidad, cantidad }))
})

const resumenTipos = computed(() => {
  const mapa = new Map<string, number>()
  for (const linea of balones.value) {
    const nombre = linea.nombreTipoBalon ?? 'Sin tipo'
    mapa.set(nombre, (mapa.get(nombre) ?? 0) + 1)
  }
  return [...mapa.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad }))
})

// ---- Cantidades en edición ----
// El input es local para que tipear no dispare una mutación por tecla: se
// confirma al salir del campo. `editando` protege el campo con foco de que la
// respuesta del servidor le pise lo que el usuario está escribiendo.
const cantidades = ref<Record<number, number | string>>({})
const editando = ref<number | null>(null)

watch(
  [productos, gruposGas],
  ([lineasProducto, grupos]) => {
    const siguiente: Record<number, number | string> = {}
    for (const grupo of grupos) siguiente[grupo.idProducto] = ''
    for (const linea of lineasProducto) {
      if (linea.idProducto != null) siguiente[linea.idProducto] = Number(linea.cantidad)
    }
    if (editando.value != null && editando.value in cantidades.value) {
      siguiente[editando.value] = cantidades.value[editando.value]
    }
    cantidades.value = siguiente
  },
  { immediate: true, deep: true },
)

function onCommitProducto(idProducto: number) {
  editando.value = null
  if (props.readonly || props.disabled) return

  const valor = cantidades.value[idProducto]
  const cantidad = valor === '' || valor == null ? 0 : Number(valor)
  if (!Number.isFinite(cantidad) || cantidad < 0) return

  const actual = productos.value.find((linea) => linea.idProducto === idProducto)
  if (Number(actual?.cantidad ?? 0) === cantidad) return

  const info = stockPorProducto.value.get(idProducto)
  emit('set-producto', {
    idProducto,
    cantidad,
    nombreProducto: info?.nombre,
    codigoProducto: info?.codigo,
    nombreUnidadMedida: info?.unidad,
  })
}

// ---- Agregar producto a mano ----
const idProductoManual = ref<number | ''>('')
const cantidadManual = ref<number | string>('')

const unidadManual = computed(() => {
  if (idProductoManual.value === '') return undefined
  return stockPorProducto.value.get(Number(idProductoManual.value))?.unidad
})

/** Ni los gases ya derivados ni los ya agregados se vuelven a ofrecer. */
const idsProductoUsados = computed(() => {
  const ids = new Set<number>(idsGasDerivado.value)
  for (const linea of productos.value) {
    if (linea.idProducto != null) ids.add(linea.idProducto)
  }
  return ids
})

const puedeAgregarManual = computed(
  () =>
    idProductoManual.value !== '' &&
    Number(cantidadManual.value) > 0 &&
    !idsProductoUsados.value.has(Number(idProductoManual.value)),
)

function onAgregarProductoManual() {
  if (!puedeAgregarManual.value || props.disabled) return

  const info = stockPorProducto.value.get(Number(idProductoManual.value))
  emit('set-producto', {
    idProducto: Number(idProductoManual.value),
    cantidad: Number(cantidadManual.value),
    nombreProducto: info?.nombre,
    codigoProducto: info?.codigo,
    nombreUnidadMedida: info?.unidad,
  })

  idProductoManual.value = ''
  cantidadManual.value = ''
}

// ---- Selector de balones ----
const idBalon = ref<number | ''>('')
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
const balonesDisponibles = computed(() =>
  (balonesQuery.data.value?.data ?? []).filter(
    (balon) => props.idAlmacen != null && esBalonEntregable(balon),
  ),
)

const idsBalonUsados = computed(
  () =>
    new Set(balones.value.map((linea) => linea.idBalon).filter((id): id is number => id != null)),
)

const balonOptions = computed(() =>
  balonesDisponibles.value
    .filter((balon) => !idsBalonUsados.value.has(balon.id))
    .map((balon) => ({
      value: balon.id,
      label: balon.codigo_balon,
      title: [balon.codigo_balon, balon.nombre_tipo_balon, balon.nombre_almacen]
        .filter(Boolean)
        .join(' · '),
    })),
)

const balonSeleccionado = computed(() => {
  if (idBalon.value === '') return null
  return balonesDisponibles.value.find((balon) => balon.id === Number(idBalon.value)) ?? null
})

function onAgregarBalon() {
  const balon = balonSeleccionado.value
  if (!balon || props.disabled) return

  emit('agregar-balon', {
    idBalon: balon.id,
    // El cilindro es una unidad: el gas que sale se declara aparte, consolidado
    // por producto, para no repetir la cantidad cilindro por cilindro.
    cantidad: 1,
    codigoBalon: balon.codigo_balon,
    idTipoBalon: balon.id_tipo_balon ?? undefined,
    nombreTipoBalon: balon.nombre_tipo_balon ?? undefined,
    nombreAlmacenBalon: balon.nombre_almacen ?? undefined,
    idProductoGas: balon.id_producto_gas ?? undefined,
    nombreProductoGas: balon.nombre_producto_gas ?? undefined,
    capacidadBalon: balon.capacidad != null ? Number(balon.capacidad) : undefined,
    unidadCapacidadBalon: balon.nombre_unidad_medida ?? undefined,
  })

  idBalon.value = ''
  balonSearch.value = ''
}
</script>
