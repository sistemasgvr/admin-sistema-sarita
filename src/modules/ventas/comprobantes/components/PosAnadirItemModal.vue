<template>
  <AppModal
    v-model="open"
    :title="titulo"
    :subtitle="subtitulo"
    :size="paso === 'catalogo' ? 'xl' : 'lg'"
  >
    <!-- Paso 1: tipo -->
    <div v-if="paso === 'tipo'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        v-for="opcion in tiposDisponibles"
        :key="opcion.key"
        type="button"
        class="flex items-start gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
        @click="elegirTipo(opcion.key)"
      >
        <span
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
        >
          <AppIcon :name="opcion.icon" :size="20" />
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">
            {{ opcion.label }}
          </span>
          <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            {{ opcion.help }}
          </span>
        </span>
      </button>
    </div>

    <!-- Paso 2: catálogo (galería / listado + filtros) -->
    <div v-else-if="paso === 'catalogo'" class="max-h-[min(70vh,640px)] overflow-y-auto">
      <PosProductPicker
        v-model:search="buscar"
        v-model:filters="dynamicFilters"
        :filter-fields="filterFields"
        :productos="productos"
        :total="productosQuery.data.value?.meta?.total ?? null"
        :loading="productosQuery.isLoading.value || productosQuery.isFetching.value"
        @filter-change="onFiltersChange"
        @add="elegirProducto"
      />
    </div>

    <!-- Paso 3: configurar -->
    <div v-else-if="paso === 'config' && producto" class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ ayudaConfig }}</p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CantidadUnidadInput
          v-if="tipo !== 'mantenimiento'"
          v-model="cantidad"
          name="pos-anadir-cantidad"
          :nombre-unidad="producto.nombre_unidad_medida ?? 'UNID'"
          :label="tipo === 'gas' ? 'Cantidad / m³' : 'Cantidad'"
        />
        <AppInput
          v-model="precioUnitario"
          :label="tipo === 'mantenimiento' ? 'Costo / importe' : 'Precio unitario'"
          type="number"
          :min="NUMBER_MIN.money"
          :step="NUMBER_STEP.money"
          required
          :class="tipo === 'mantenimiento' ? 'sm:col-span-2' : ''"
        />
      </div>

      <template v-if="tipo === 'gas'">
        <div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            ¿Qué pasa con el cilindro?
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opcion in escenariosGas"
              :key="opcion.key"
              type="button"
              class="flex items-start gap-2 rounded-xl border px-2.5 py-2.5 text-left transition sm:gap-3 sm:px-3 sm:py-3"
              :class="
                escenarioGas === opcion.key
                  ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10'
                  : 'border-gray-200 hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500'
              "
              @click="setEscenarioGas(opcion.key)"
            >
              <span
                class="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8"
                :class="
                  escenarioGas === opcion.key
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'
                "
              >
                <AppIcon :name="opcion.icon" :size="15" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold leading-snug text-gray-800 dark:text-white/90">
                  {{ opcion.label }}
                </span>
                <span class="mt-0.5 block text-[11px] leading-snug text-gray-500 dark:text-gray-400 sm:text-xs">
                  {{ opcion.help }}
                </span>
              </span>
            </button>
          </div>
        </div>

        <template v-if="escenarioGas === 'balon_cliente'">
          <p
            v-if="esClientesVarios"
            class="rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
          >
            La recarga con balón del cliente requiere un cliente identificado.
          </p>
          <PosBalonSelectField
            v-model="idBalon"
            v-model:etiqueta="etiquetaBalon"
            mode="cliente"
            :id-cliente="idCliente"
            label="Balón del cliente"
            placeholder="Prestado o propio del cliente"
            register-label="Registrar balón propio del cliente"
            empty-text="Sin balones. Registra el del cliente."
            required
          />
          <AppInput
            v-model="capacidad"
            label="Capacidad cilindro"
            type="number"
            :min="0"
            :step="NUMBER_STEP.money"
            placeholder="Opcional"
          />
        </template>

        <template v-else-if="escenarioGas === 'entregar_alquiler'">
          <div
            class="rounded-xl border border-violet-200 bg-violet-50/50 px-3 py-2.5 dark:border-violet-500/30 dark:bg-violet-500/10"
          >
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
              Gas + alquiler del cilindro
            </p>
            <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              Cobras el gas y el periodo de alquiler. El cilindro se entrega al cliente del
              comprobante.
            </p>
            <p class="mt-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
              Cliente:
              {{
                nombreCliente?.trim() ||
                (idCliente ? `Cliente #${idCliente}` : 'Selecciona el cliente en el comprobante')
              }}
            </p>
            <p
              v-if="esClientesVarios"
              class="mt-1 text-xs font-medium text-error-600 dark:text-error-400"
            >
              No se puede alquilar a Clientes Varios. Elige un cliente identificado en el
              comprobante.
            </p>
          </div>

          <ProductoSelectField
            v-model="idProductoAlquiler"
            v-model:search="productoAlquilerBuscar"
            label="Producto de alquiler a facturar"
            placeholder="Producto o servicio alquilable del catálogo"
            search-placeholder="Código o nombre..."
            :es-alquilable="true"
            hint="Usa productos marcados como Alquilable en el catálogo (puedes crear uno aquí)."
            required
            @created="onProductoAlquilerCreated"
          />
          <PosBalonSelectField
            v-model="idBalon"
            v-model:etiqueta="etiquetaBalon"
            mode="alquiler"
            :id-almacen="idAlmacen"
            label="Cilindro a entregar"
            placeholder="Cilindro en almacén"
            empty-text="Sin cilindros disponibles en almacén."
            required
          />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput v-model="fechaInicio" label="Inicio alquiler" type="date" required />
            <AppInput v-model="fechaFin" label="Fin pactado" type="date" required />
          </div>
          <AppInput
            v-model="precioAlquiler"
            label="Precio del alquiler"
            type="number"
            :min="NUMBER_MIN.money"
            :step="NUMBER_STEP.money"
            required
          />

          <div
            class="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-white/[0.03]"
          >
            <div>
              <p class="text-gray-500 dark:text-gray-400">Gas</p>
              <p class="font-medium tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(importeGas) }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400">Alquiler</p>
              <p class="font-medium tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(Number(precioAlquiler || 0)) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-gray-500 dark:text-gray-400">Total ítem</p>
              <p class="font-semibold tabular-nums text-brand-600 dark:text-brand-400">
                {{ formatMoney(importe) }}
              </p>
            </div>
          </div>
        </template>

        <template v-else-if="escenarioGas === 'comprar_balon'">
          <div
            class="rounded-xl border border-brand-200 bg-brand-50/40 px-3 py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10"
          >
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
              Venta del envase + gas
            </p>
            <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              Elige el cilindro y el precio del envase. Se factura gas + venta de envase; el
              cilindro queda vendido al cliente.
            </p>
            <p class="mt-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
              Cliente:
              {{
                nombreCliente?.trim() ||
                (idCliente ? `Cliente #${idCliente}` : 'Selecciona el cliente en el comprobante')
              }}
            </p>
          </div>

          <PosBalonSelectField
            v-model="idBalon"
            v-model:etiqueta="etiquetaBalon"
            mode="alquiler"
            :id-almacen="idAlmacen"
            label="Cilindro a vender"
            placeholder="Solo cilindros de la empresa en almacén"
            empty-text="Sin cilindros de empresa disponibles."
            required
          />

          <AppInput
            v-model="precioBalon"
            label="Precio venta envase"
            type="number"
            :min="NUMBER_MIN.money"
            :step="NUMBER_STEP.money"
            required
          />

          <div
            class="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-white/[0.03]"
          >
            <div>
              <p class="text-gray-500 dark:text-gray-400">Gas</p>
              <p class="font-medium tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(importeGas) }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400">Envase</p>
              <p class="font-medium tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(Number(precioBalon || 0)) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-gray-500 dark:text-gray-400">Total ítem</p>
              <p class="font-semibold tabular-nums text-brand-600 dark:text-brand-400">
                {{ formatMoney(importe) }}
              </p>
            </div>
          </div>
        </template>

        <p
          v-else-if="escenarioGas === 'solo_gas'"
          class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"
        >
          Solo se cobra el gas. No se vincula ni entrega cilindro en este ítem.
        </p>
      </template>

      <template v-else-if="tipo === 'alquiler'">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInput v-model="fechaInicio" label="Inicio alquiler" type="date" required />
          <AppInput v-model="fechaFin" label="Fin pactado" type="date" required />
        </div>
        <PosBalonSelectField
          v-model="idBalon"
          v-model:etiqueta="etiquetaBalon"
          mode="alquiler"
          :id-almacen="idAlmacen"
          label="Cilindro (opcional)"
          placeholder="Solo si entregas un cilindro"
          empty-text="Sin cilindros en almacén."
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Reguladores u otros ítems alquilables no requieren cilindro. Déjalo vacío si no aplica.
        </p>
      </template>

      <template v-else-if="tipo === 'mantenimiento'">
        <p
          v-if="esClientesVarios"
          class="rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
        >
          El mantenimiento requiere un cliente identificado (se hace seguimiento del cilindro).
        </p>
        <PosBalonSelectField
          v-model="idBalon"
          v-model:etiqueta="etiquetaBalon"
          mode="cliente"
          :id-cliente="idCliente"
          label="Cilindro del cliente"
          placeholder="Propio o prestado"
          register-label="Registrar cilindro del cliente"
          empty-text="Sin cilindros del cliente."
          required
        />
        <AppSelectSearch
          v-model="idTipoMantenimiento"
          v-model:search="tipoMantenimientoBuscar"
          label="Tipo de mantenimiento"
          placeholder="P.H., válvula, etc."
          search-placeholder="Buscar tipo..."
          :options="tipoMantenimientoOptions"
          :loading="tiposMantenimientoQuery.isFetching.value"
        />
        <AppInput v-model="fechaIngreso" label="Fecha ingreso" type="date" required />
        <AppInput
          v-model="descripcionMantenimiento"
          label="Descripción"
          placeholder="Detalle del trabajo"
        />
      </template>

      <AppInput v-model="observacion" label="Nota del ítem" placeholder="Opcional" />

      <p
        v-if="
          !(
            tipo === 'gas' &&
            (escenarioGas === 'comprar_balon' || escenarioGas === 'entregar_alquiler')
          )
        "
        class="text-right text-sm font-medium tabular-nums text-gray-700 dark:text-gray-300"
      >
        Importe: {{ formatMoney(importe) }}
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        @click="onSecundario"
      >
        {{ textoSecundario }}
      </button>
      <button
        v-if="paso === 'config'"
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        :disabled="!puedeConfirmar"
        @click="confirmar"
      >
        <AppIcon :name="ICONS.plus" :size="16" />
        {{ modoEdicion ? 'Actualizar ítem' : 'Agregar al carrito' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { subCategoriasProductoService } from '@/modules/productos/sub-categorias/services/sub-categorias-producto.service'
import type { SubCategoriaProducto } from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { Producto, ProductoListFilters } from '@/modules/productos/articulos/interfaces/producto.interface'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import { filtrarProductosCatalogo } from '@/modules/productos/articulos/utils/productosSistema'
import CantidadUnidadInput from '@/modules/ventas/comprobantes/components/CantidadUnidadInput.vue'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import PosProductPicker from '@/modules/ventas/comprobantes/components/PosProductPicker.vue'
import { addDaysIso } from '@/modules/ventas/comprobantes/composables/usePosKitMedicinal'
import {
  CODIGO_PRODUCTO_VENTA_ENVASE,
  NOMBRE_PRODUCTO_VENTA_ENVASE,
} from '@/modules/ventas/comprobantes/constants/ventaEnvase'
import type { PosLineItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import {
  productoAfectaStock,
  productoSinStockParaVenta,
  validarStockParaAgregar,
} from '@/modules/ventas/comprobantes/utils/stockPos'
import { validarCantidadSegunUnidad } from '@/modules/ventas/comprobantes/utils/unidadMedidaCantidad'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'

export type PosAnadirTipo = 'accesorio' | 'gas' | 'alquiler' | 'mantenimiento'
export type EscenarioGas =
  | 'solo_gas'
  | 'balon_cliente'
  | 'entregar_alquiler'
  | 'comprar_balon'
type Paso = 'tipo' | 'catalogo' | 'config'

export interface PosLineaConfirmada {
  tipo: PosAnadirTipo
  producto: Producto
  cantidad: number
  precioUnitario: number
  idBalon?: number
  capacidad?: number
  fechaInicioAlquiler?: string
  fechaFinAlquiler?: string
  observacionLinea?: string
  idTipoMantenimiento?: number
  fechaIngresoMantenimiento?: string
  descripcionMantenimiento?: string
  escenarioGas?: EscenarioGas
  precioBalon?: number
  idProductoEnvase?: number
  nombreProductoEnvase?: string
  precioAlquiler?: number
  idProductoAlquiler?: number
  nombreProductoAlquiler?: string
  etiquetaBalon?: string
}

const props = withDefaults(
  defineProps<{
    idCliente?: number | ''
    idAlmacen?: number | ''
    /** Nombre del cliente del comprobante (para gas + alquiler). */
    nombreCliente?: string
    /** true si el cliente del comprobante es CVARIOS (mostrador). */
    esClientesVarios?: boolean
    /** Edición de una línea ya en el carrito. */
    linea?: PosLineItem | null
    productoEdicion?: Producto | null
  }>(),
  {
    idCliente: '',
    idAlmacen: '',
    nombreCliente: '',
    esClientesVarios: false,
    linea: null,
    productoEdicion: null,
  },
)

const emit = defineEmits<{
  confirm: [payload: PosLineaConfirmada]
}>()

const open = defineModel<boolean>({ default: false })
const authStore = useAuthStore()

const paso = ref<Paso>('tipo')
const tipo = ref<PosAnadirTipo | null>(null)
const producto = ref<Producto | null>(null)
const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const categorias = ref<CategoriaProducto[]>([])
const subCategorias = ref<SubCategoriaProducto[]>([])
const categoriaIdsEnTipo = ref<Set<number>>(new Set())
const subCategoriaIdsEnTipo = ref<Set<number>>(new Set())
let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const cantidad = ref(1)
const precioUnitario = ref<number | string>(0)
const idBalon = ref<number | ''>('')
const etiquetaBalon = ref('')
const capacidad = ref<number | string>('')
const fechaInicio = ref('')
const fechaFin = ref('')
const observacion = ref('')
const idTipoMantenimiento = ref<number | ''>('')
const tipoMantenimientoBuscar = ref('')
const fechaIngreso = ref(new Date().toISOString().slice(0, 10))
const descripcionMantenimiento = ref('')
const escenarioGas = ref<EscenarioGas | null>(null)
const precioBalon = ref<number | string>(0)
const idProductoEnvase = ref<number | ''>('')
const nombreProductoEnvase = ref(NOMBRE_PRODUCTO_VENTA_ENVASE)
const resolviendoProductoEnvase = ref(false)
const precioAlquiler = ref<number | string>(0)
const idProductoAlquiler = ref<number | ''>('')
const nombreProductoAlquiler = ref('')
const productoAlquilerBuscar = ref('')
const cargandoProductoAlquiler = ref(false)

const importeGas = computed(() => {
  if (tipo.value === 'mantenimiento') return Number(precioUnitario.value || 0)
  return Number(cantidad.value || 0) * Number(precioUnitario.value || 0)
})

const importe = computed(() => {
  if (tipo.value === 'gas' && escenarioGas.value === 'comprar_balon') {
    return importeGas.value + Number(precioBalon.value || 0)
  }
  if (tipo.value === 'gas' && escenarioGas.value === 'entregar_alquiler') {
    return importeGas.value + Number(precioAlquiler.value || 0)
  }
  return importeGas.value
})

/** Resuelve en silencio el producto contable VTA-ENVASE (no se elige en el POS). */
async function resolverProductoVentaEnvase(): Promise<boolean> {
  if (idProductoEnvase.value) return true
  resolviendoProductoEnvase.value = true
  try {
    const response = await productosService.listar({
      pagina: 1,
      limite: 20,
      soloActivos: 1,
      buscar: CODIGO_PRODUCTO_VENTA_ENVASE,
    })
    const match = response.data.find(
      (item) => item.codigo.trim().toUpperCase() === CODIGO_PRODUCTO_VENTA_ENVASE,
    )

    if (!match) {
      toastWarning(
        `Falta el producto ${CODIGO_PRODUCTO_VENTA_ENVASE} (Venta de envase) en el catálogo`,
      )
      return false
    }

    idProductoEnvase.value = match.id
    nombreProductoEnvase.value = match.nombre || NOMBRE_PRODUCTO_VENTA_ENVASE
    return true
  } catch {
    toastWarning('No se pudo cargar el producto de venta de envase')
    return false
  } finally {
    resolviendoProductoEnvase.value = false
  }
}

async function sincronizarProductoAlquiler(id: number | '', opts?: { forzarPrecio?: boolean }) {
  if (!id) {
    nombreProductoAlquiler.value = ''
    return
  }
  cargandoProductoAlquiler.value = true
  try {
    const match = await productosService.obtenerPorId(Number(id))
    if (!match.es_alquilable) {
      toastWarning('El producto seleccionado no está marcado como alquilable')
      idProductoAlquiler.value = ''
      nombreProductoAlquiler.value = ''
      return
    }
    nombreProductoAlquiler.value = match.nombre
    if (opts?.forzarPrecio || !Number(precioAlquiler.value)) {
      precioAlquiler.value = Number(match.precio ?? 0)
    }
  } catch {
    toastWarning('No se pudo cargar el producto de alquiler')
  } finally {
    cargandoProductoAlquiler.value = false
  }
}

function onProductoAlquilerCreated(creado: Producto) {
  if (!creado.es_alquilable) {
    toastWarning('Marca el producto como Alquilable para usarlo en este flujo')
    return
  }
  idProductoAlquiler.value = creado.id
  nombreProductoAlquiler.value = creado.nombre
  productoAlquilerBuscar.value = ''
  if (!Number(precioAlquiler.value)) {
    precioAlquiler.value = Number(creado.precio ?? 0)
  }
}

watch(idProductoAlquiler, (id, prev) => {
  void sincronizarProductoAlquiler(id, {
    forzarPrecio: Boolean(prev) && Boolean(id) && prev !== id,
  })
})

const escenariosGas = computed(() => {
  const opciones: {
    key: EscenarioGas
    label: string
    help: string
    icon: string
  }[] = [
    {
      key: 'solo_gas',
      label: 'Solo gas',
      help: 'Ya tiene cilindro; solo cobras el contenido.',
      icon: ICONS.package,
    },
    {
      key: 'balon_cliente',
      label: 'Balón del cliente',
      help: 'Recarga sobre cilindro propio o prestado.',
      icon: ICONS.users,
    },
  ]

  if (authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR)) {
    opciones.push({
      key: 'entregar_alquiler',
      label: 'Entregar / alquilar',
      help: 'Cilindro del almacén + producto alquilable del catálogo.',
      icon: ICONS.calendar,
    })
  }

  if (authStore.hasPermission(PermisoBanderas.BAJAS_BALON_SOLICITAR)) {
    opciones.push({
      key: 'comprar_balon',
      label: 'Vender envase + gas',
      help: 'El cliente se queda con el cilindro.',
      icon: ICONS.shoppingcard,
    })
  }

  return opciones
})

function setEscenarioGas(key: EscenarioGas) {
  if (
    (key === 'entregar_alquiler' || key === 'comprar_balon') &&
    !props.idAlmacen
  ) {
    toastWarning('Selecciona un almacén en el comprobante para elegir el cilindro')
    return
  }
  if (key === 'balon_cliente' && !props.idCliente) {
    toastWarning('Selecciona un cliente para vincular su balón')
    return
  }
  if (key === 'comprar_balon' && !props.idCliente) {
    toastWarning('Selecciona un cliente comprador del cilindro')
    return
  }
  if (key === 'entregar_alquiler' && !props.idCliente) {
    toastWarning('Selecciona el cliente al que se alquila el cilindro')
    return
  }
  if (key === 'entregar_alquiler' && !authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR)) {
    toastWarning('No tienes permiso para registrar alquileres de cilindro')
    return
  }
  if (key === 'comprar_balon' && !authStore.hasPermission(PermisoBanderas.BAJAS_BALON_SOLICITAR)) {
    toastWarning('No tienes permiso para registrar la baja por venta del cilindro')
    return
  }
  // Operaciones con seguimiento del cilindro exigen cliente identificado.
  if ((key === 'entregar_alquiler' || key === 'balon_cliente') && props.esClientesVarios) {
    toastWarning(
      key === 'entregar_alquiler'
        ? 'No se puede alquilar un cilindro a Clientes Varios. Selecciona un cliente identificado.'
        : 'La recarga con balón del cliente requiere un cliente identificado.',
    )
    return
  }
  if (escenarioGas.value === key) return
  escenarioGas.value = key
  idBalon.value = ''
  etiquetaBalon.value = ''
  capacidad.value = ''
  precioBalon.value = 0
  idProductoEnvase.value = ''
  nombreProductoEnvase.value = NOMBRE_PRODUCTO_VENTA_ENVASE
  precioAlquiler.value = 0
  idProductoAlquiler.value = ''
  nombreProductoAlquiler.value = ''
  productoAlquilerBuscar.value = ''
  if (key === 'entregar_alquiler') {
    fechaInicio.value = new Date().toISOString().slice(0, 10)
    fechaFin.value = addDaysIso(fechaInicio.value, 14)
  }
  if (key === 'comprar_balon') {
    void resolverProductoVentaEnvase()
  }
}

const listaTipoMantenimientoId = ref(ListaIds.TIPO_MANTENIMIENTO)
const tiposMantenimientoQuery = useListaOpcionesQuery(listaTipoMantenimientoId)
const tipoMantenimientoOptions = computed(() =>
  toSelectOptions(tiposMantenimientoQuery.data.value),
)

const modoEdicion = computed(() => Boolean(props.linea))

const tiposDisponibles = computed(() => {
  const opciones: {
    key: PosAnadirTipo
    label: string
    help: string
    icon: string
  }[] = []

  if (authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR)) {
    opciones.push({
      key: 'accesorio',
      label: 'Accesorio / producto',
      help: 'Válvulas, descartables, reguladores de venta, etc.',
      icon: ICONS.package,
    })
  }

  if (
    authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR) ||
    authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR)
  ) {
    opciones.push({
      key: 'gas',
      label: 'Gas / recarga',
      help: 'Cobrar gas y opcionalmente vincular el balón del cliente.',
      icon: ICONS.cylinder,
    })
  }

  if (authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR)) {
    opciones.push({
      key: 'alquiler',
      label: 'Alquiler',
      help: 'Producto o servicio alquilable (cilindro opcional) con fechas.',
      icon: ICONS.calendar,
    })
  }

  if (authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_CREAR)) {
    opciones.push({
      key: 'mantenimiento',
      label: 'Mantenimiento',
      help: 'Servicio de taller (P.H., válvula…) con cilindro del cliente.',
      icon: ICONS.construction,
    })
  }

  return opciones
})

const filters = ref<ProductoListFilters>({
  pagina: 1,
  limite: 500,
  soloActivos: 1,
  incluirImagenes: true,
})

const productosQuery = useProductosQuery(filters)

const productosBase = computed(() =>
  filtrarProductosCatalogo(productosQuery.data.value?.data ?? []),
)

const productos = computed(() => {
  const marca = dynamicFilters.value.marca
  if (!marca) return productosBase.value
  return productosBase.value.filter((item) => item.marca === marca)
})

watch(
  productosBase,
  (list) => {
    if (dynamicFilters.value.idCategoria != null) return
    const cats = new Set(categoriaIdsEnTipo.value)
    const subs = new Set(subCategoriaIdsEnTipo.value)
    for (const item of list) {
      if (item.id_categoria != null) cats.add(item.id_categoria)
      if (item.id_sub_categoria != null) subs.add(item.id_sub_categoria)
    }
    categoriaIdsEnTipo.value = cats
    subCategoriaIdsEnTipo.value = subs
  },
  { immediate: true },
)

const categoriasEnTipo = computed(() => {
  const ids = new Set(categoriaIdsEnTipo.value)
  const selected = dynamicFilters.value.idCategoria
  if (selected != null) ids.add(Number(selected))
  return categorias.value
    .filter((categoria) => ids.has(categoria.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
})

const subCategoriasEnTipo = computed(() => {
  const ids = new Set(subCategoriaIdsEnTipo.value)
  const selected = dynamicFilters.value.idSubCategoria
  if (selected != null) ids.add(Number(selected))
  return subCategorias.value
    .filter((sub) => ids.has(sub.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
})

const filterFields = computed<DynamicFilterFieldDef[]>(() => {
  const categoriaId =
    dynamicFilters.value.idCategoria != null
      ? Number(dynamicFilters.value.idCategoria)
      : null

  const marcas = new Set<string>()
  for (const item of productosBase.value) {
    const valor = item.marca?.trim()
    if (valor) marcas.add(valor)
  }

  return [
    {
      key: 'idCategoria',
      label: 'Categoría',
      type: 'select',
      placeholder: 'Seleccionar categoría',
      options: categoriasEnTipo.value.map((categoria) => ({
        value: categoria.id,
        label: categoria.nombre,
      })),
    },
    {
      key: 'idSubCategoria',
      label: 'Subcategoría',
      type: 'select',
      placeholder: 'Seleccionar subcategoría',
      disabled: !categoriaId,
      options: subCategoriasEnTipo.value
        .filter((sub) => (categoriaId ? sub.id_categoria === categoriaId : true))
        .map((sub) => ({
          value: sub.id,
          label: sub.nombre,
        })),
    },
    {
      key: 'marca',
      label: 'Marca',
      type: 'select',
      placeholder: 'Seleccionar marca',
      options: [...marcas].sort((a, b) => a.localeCompare(b, 'es')).map((valor) => ({
        value: valor,
        label: valor,
      })),
    },
  ]
})

async function loadCatalogosFiltro() {
  try {
    const [categoriasResponse, subCategoriasResponse] = await Promise.all([
      categoriasProductoService.listar({ pagina: 1, limite: 100 }),
      subCategoriasProductoService.listar({ pagina: 1, limite: 500 }),
    ])
    categorias.value = categoriasResponse.data
    subCategorias.value = subCategoriasResponse.data
  } catch {
    categorias.value = []
    subCategorias.value = []
  }
}

onMounted(() => {
  void loadCatalogosFiltro()
})

const titulo = computed(() => {
  if (modoEdicion.value) return 'Editar ítem'
  if (paso.value === 'tipo') return '¿Qué deseas añadir?'
  if (paso.value === 'catalogo') {
    if (tipo.value === 'gas') return 'Elegir gas'
    if (tipo.value === 'alquiler') return 'Elegir alquiler'
    if (tipo.value === 'mantenimiento') return 'Elegir servicio'
    return 'Elegir producto'
  }
  return producto.value?.nombre || 'Configurar ítem'
})

const subtitulo = computed(() => {
  if (paso.value === 'config' && producto.value) return producto.value.codigo
  if (paso.value === 'catalogo') return 'Selecciona un ítem del catálogo'
  return 'Cada ítem se registra de forma independiente'
})

const ayudaConfig = computed(() => {
  if (tipo.value === 'gas') {
    return 'Precio del gas primero. Luego indica si solo cobras gas, recargas, alquilas (elige producto alquilable) o vendes el envase.'
  }
  if (tipo.value === 'alquiler') {
    return 'Define el periodo. Si entregas un cilindro, selecciónalo; si no, déjalo vacío.'
  }
  if (tipo.value === 'mantenimiento') {
    return 'Queda pendiente en taller hasta finalizarlo en Balones → Mantenimientos.'
  }
  return 'Ajusta cantidad y precio.'
})

const puedeConfirmar = computed(() => {
  if (!producto.value || !tipo.value) return false
  if (Number(precioUnitario.value) < 0) return false
  if (tipo.value === 'mantenimiento') {
    return (
      Boolean(props.idCliente) &&
      !props.esClientesVarios &&
      Boolean(idBalon.value && fechaIngreso.value)
    )
  }
  if (Number(cantidad.value) <= 0) return false
  if (tipo.value === 'alquiler') {
    return (
      Boolean(props.idCliente) &&
      !props.esClientesVarios &&
      Boolean(fechaInicio.value && fechaFin.value)
    )
  }
  if (tipo.value === 'gas') {
    if (!escenarioGas.value) return false
    if (escenarioGas.value === 'balon_cliente') {
      return (
        Boolean(props.idCliente) &&
        !props.esClientesVarios &&
        Boolean(idBalon.value)
      )
    }
    if (escenarioGas.value === 'entregar_alquiler') {
      return (
        Boolean(props.idCliente) &&
        !props.esClientesVarios &&
        Boolean(idBalon.value) &&
        Boolean(fechaInicio.value && fechaFin.value) &&
        fechaFin.value >= fechaInicio.value &&
        Number(precioAlquiler.value) >= 0 &&
        Boolean(idProductoAlquiler.value) &&
        !cargandoProductoAlquiler.value
      )
    }
    if (escenarioGas.value === 'comprar_balon') {
      return (
        Boolean(idBalon.value) &&
        Number(precioBalon.value) >= 0 &&
        Boolean(idProductoEnvase.value) &&
        !resolviendoProductoEnvase.value
      )
    }
    return true
  }
  return true
})

const textoSecundario = computed(() => {
  if (paso.value === 'tipo' || modoEdicion.value) return 'Cancelar'
  if (paso.value === 'catalogo') return 'Atrás'
  return 'Atrás'
})

function filtrosPorTipo(t: PosAnadirTipo): Partial<ProductoListFilters> {
  if (t === 'gas') return { esGas: true }
  if (t === 'accesorio') return { esGas: false, esServicio: false }
  if (t === 'alquiler') return { esAlquilable: true }
  return { esServicio: true, esAlquilable: false }
}

function syncFilters() {
  if (!tipo.value) return
  const active = dynamicFilters.value
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: 1,
    limite: 500,
    soloActivos: 1,
    incluirImagenes: true,
    idAlmacen: props.idAlmacen ? Number(props.idAlmacen) : undefined,
    idCategoria: active.idCategoria != null ? Number(active.idCategoria) : undefined,
    idSubCategoria:
      active.idSubCategoria != null ? Number(active.idSubCategoria) : undefined,
    ...filtrosPorTipo(tipo.value),
  }
}

function onFiltersChange() {
  const active = { ...dynamicFilters.value }
  const categoriaId =
    active.idCategoria != null ? Number(active.idCategoria) : null

  if (active.idSubCategoria != null) {
    const subCategoria = subCategorias.value.find(
      (item) => item.id === Number(active.idSubCategoria),
    )
    if (!categoriaId || subCategoria?.id_categoria !== categoriaId) {
      delete active.idSubCategoria
      dynamicFilters.value = active
    }
  }

  syncFilters()
}

function resetConfig(fromProducto?: Producto | null, fromLinea?: PosLineItem | null) {
  if (fromLinea) {
    cantidad.value = Math.max(1, Number(fromLinea.cantidad || 1))
    precioUnitario.value = Number(fromLinea.precioUnitario || 0)
    idBalon.value = fromLinea.idBalon ?? ''
    etiquetaBalon.value = fromLinea.etiquetaBalon ?? ''
    capacidad.value = fromLinea.capacidad ?? ''
    fechaInicio.value =
      fromLinea.fechaInicioAlquiler || new Date().toISOString().slice(0, 10)
    fechaFin.value =
      fromLinea.fechaFinAlquiler || addDaysIso(fechaInicio.value, 14)
    observacion.value = fromLinea.observacionLinea || ''
    idTipoMantenimiento.value = fromLinea.idTipoMantenimiento ?? ''
    fechaIngreso.value =
      fromLinea.fechaIngresoMantenimiento || new Date().toISOString().slice(0, 10)
    descripcionMantenimiento.value =
      fromLinea.descripcionMantenimiento || fromLinea.nombre || ''
    escenarioGas.value =
      fromLinea.escenarioGas ||
      (fromLinea.esGas
        ? fromLinea.fechaInicioAlquiler
          ? 'entregar_alquiler'
          : fromLinea.precioBalon != null
            ? 'comprar_balon'
            : fromLinea.idBalon
              ? 'balon_cliente'
              : 'solo_gas'
        : null)
    precioBalon.value = fromLinea.precioBalon ?? 0
    idProductoEnvase.value = fromLinea.idProductoEnvase ?? ''
    nombreProductoEnvase.value =
      fromLinea.nombreProductoEnvase || NOMBRE_PRODUCTO_VENTA_ENVASE
    precioAlquiler.value = fromLinea.precioAlquiler ?? 0
    idProductoAlquiler.value = fromLinea.idProductoAlquiler ?? ''
    nombreProductoAlquiler.value = fromLinea.nombreProductoAlquiler || ''
    productoAlquilerBuscar.value = ''
    if (fromLinea.escenarioGas === 'comprar_balon' || fromLinea.precioBalon != null) {
      void resolverProductoVentaEnvase()
    }
    if (idProductoAlquiler.value) {
      void sincronizarProductoAlquiler(idProductoAlquiler.value)
    }
    return
  }

  cantidad.value = 1
  precioUnitario.value = Number(fromProducto?.precio ?? 0)
  idBalon.value = ''
  etiquetaBalon.value = ''
  capacidad.value = ''
  fechaInicio.value = new Date().toISOString().slice(0, 10)
  fechaFin.value = addDaysIso(fechaInicio.value, 14)
  observacion.value = ''
  idTipoMantenimiento.value = ''
  fechaIngreso.value = new Date().toISOString().slice(0, 10)
  descripcionMantenimiento.value = fromProducto?.nombre || ''
  escenarioGas.value = null
  precioBalon.value = 0
  idProductoEnvase.value = ''
  nombreProductoEnvase.value = NOMBRE_PRODUCTO_VENTA_ENVASE
  precioAlquiler.value = 0
  idProductoAlquiler.value = ''
  nombreProductoAlquiler.value = ''
  productoAlquilerBuscar.value = ''
}

function elegirTipo(t: PosAnadirTipo) {
  if (t !== 'accesorio' && t !== 'mantenimiento' && !props.idAlmacen) {
    // alquiler necesita almacén; gas también para stock
    if (t === 'alquiler' || t === 'gas') {
      toastWarning('Selecciona un almacén en el comprobante antes de añadir')
      return
    }
  }
  if ((t === 'alquiler' || t === 'mantenimiento') && props.esClientesVarios) {
    toastWarning(
      t === 'alquiler'
        ? 'No se puede registrar un alquiler a Clientes Varios. Selecciona un cliente identificado.'
        : 'No se puede registrar un mantenimiento a Clientes Varios. Selecciona un cliente identificado.',
    )
    return
  }
  tipo.value = t
  producto.value = null
  buscar.value = ''
  dynamicFilters.value = {}
  categoriaIdsEnTipo.value = new Set()
  subCategoriaIdsEnTipo.value = new Set()
  syncFilters()
  paso.value = 'catalogo'
}

function elegirProducto(p: Producto) {
  if (productoSinStockParaVenta(p)) {
    toastWarning(`${p.nombre} no tiene stock disponible`)
    return
  }
  producto.value = p
  resetConfig(p)
  paso.value = 'config'
}

function onSecundario() {
  if (modoEdicion.value || paso.value === 'tipo') {
    open.value = false
    return
  }
  if (paso.value === 'config') {
    paso.value = 'catalogo'
    producto.value = null
    return
  }
  paso.value = 'tipo'
  tipo.value = null
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
    Number(value || 0),
  )
}

async function confirmar() {
  if (!producto.value || !tipo.value || !puedeConfirmar.value) return

  const cant = tipo.value === 'mantenimiento' ? 1 : Number(cantidad.value)
  const errorCantidad = validarCantidadSegunUnidad(
    cant,
    producto.value.nombre_unidad_medida ?? 'UNID',
    producto.value.nombre,
  )
  if (errorCantidad) {
    toastWarning(errorCantidad)
    return
  }

  if (productoAfectaStock(producto.value)) {
    const errorStock = validarStockParaAgregar(producto.value, cant, {
      requiereAlmacenSeleccionado: true,
    })
    if (errorStock) {
      toastWarning(errorStock)
      return
    }
  }

  if (tipo.value === 'gas' && escenarioGas.value === 'balon_cliente') {
    if (!props.idCliente) {
      toastWarning('Selecciona un cliente para vincular su balón')
      return
    }
    if (props.esClientesVarios) {
      toastWarning('La recarga con balón del cliente requiere un cliente identificado.')
      return
    }
  }
  if (tipo.value === 'gas' && escenarioGas.value === 'comprar_balon') {
    if (!authStore.hasPermission(PermisoBanderas.BAJAS_BALON_SOLICITAR)) {
      toastWarning('No tienes permiso para registrar la baja por venta del cilindro')
      return
    }
    const ok = await resolverProductoVentaEnvase()
    if (!ok || !idProductoEnvase.value) return
  }
  if (tipo.value === 'gas' && escenarioGas.value === 'entregar_alquiler') {
    if (!props.idCliente) {
      toastWarning('Selecciona el cliente al que se alquila el cilindro')
      return
    }
    if (props.esClientesVarios) {
      toastWarning(
        'No se puede alquilar un cilindro a Clientes Varios. Selecciona un cliente identificado.',
      )
      return
    }
    if (!authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR)) {
      toastWarning('No tienes permiso para registrar alquileres de cilindro')
      return
    }
    if (!idProductoAlquiler.value) {
      toastWarning('Selecciona el producto de alquiler del catálogo')
      return
    }
  }
  if (tipo.value === 'alquiler' && props.esClientesVarios) {
    toastWarning(
      'No se puede registrar un alquiler a Clientes Varios. Selecciona un cliente identificado.',
    )
    return
  }
  if (tipo.value === 'mantenimiento' && props.esClientesVarios) {
    toastWarning(
      'No se puede registrar un mantenimiento a Clientes Varios. Selecciona un cliente identificado.',
    )
    return
  }

  const payload: PosLineaConfirmada = {
    tipo: tipo.value,
    producto: producto.value,
    cantidad: cant,
    precioUnitario: Number(precioUnitario.value || 0),
    observacionLinea: observacion.value.trim() || undefined,
  }

  if (idBalon.value) {
    payload.idBalon = Number(idBalon.value)
    payload.etiquetaBalon = etiquetaBalon.value.trim() || undefined
  }

  if (tipo.value === 'gas' && escenarioGas.value) {
    payload.escenarioGas = escenarioGas.value
    if (escenarioGas.value === 'balon_cliente') {
      if (capacidad.value !== '' && capacidad.value != null) {
        payload.capacidad = Number(capacidad.value)
      }
    }
    if (escenarioGas.value === 'entregar_alquiler') {
      payload.fechaInicioAlquiler = fechaInicio.value
      payload.fechaFinAlquiler = fechaFin.value
      payload.precioAlquiler = Number(precioAlquiler.value || 0)
      payload.idProductoAlquiler = Number(idProductoAlquiler.value)
      payload.nombreProductoAlquiler = nombreProductoAlquiler.value
    }
    if (escenarioGas.value === 'comprar_balon') {
      payload.precioBalon = Number(precioBalon.value || 0)
      payload.idProductoEnvase = Number(idProductoEnvase.value)
      payload.nombreProductoEnvase = nombreProductoEnvase.value
    }
  }

  if (tipo.value === 'alquiler') {
    payload.fechaInicioAlquiler = fechaInicio.value
    payload.fechaFinAlquiler = fechaFin.value
  }

  if (tipo.value === 'mantenimiento') {
    payload.fechaIngresoMantenimiento = fechaIngreso.value
    payload.descripcionMantenimiento =
      descripcionMantenimiento.value.trim() || producto.value.nombre
    if (idTipoMantenimiento.value) {
      payload.idTipoMantenimiento = Number(idTipoMantenimiento.value)
    }
  }

  emit('confirm', payload)
  open.value = false
}

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) return

    if (props.linea && props.productoEdicion) {
      const t =
        props.linea.tipoPos ||
        (props.linea.esMantenimiento
          ? 'mantenimiento'
          : props.linea.esGas
            ? 'gas'
            : props.linea.esAlquilable
              ? 'alquiler'
              : 'accesorio')
      tipo.value = t
      producto.value = props.productoEdicion
      resetConfig(props.productoEdicion, props.linea)
      paso.value = 'config'
      return
    }

    paso.value = 'tipo'
    tipo.value = null
    producto.value = null
    buscar.value = ''
    dynamicFilters.value = {}
    resetConfig()
  },
)

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    if (paso.value === 'catalogo') syncFilters()
  }, 350)
})

watch(fechaInicio, (inicio) => {
  if (!inicio) return
  if (!fechaFin.value || fechaFin.value < inicio) {
    fechaFin.value = addDaysIso(inicio, 14)
  }
})

watch(
  () => props.idAlmacen,
  () => {
    if (tipo.value) syncFilters()
  },
)
</script>
