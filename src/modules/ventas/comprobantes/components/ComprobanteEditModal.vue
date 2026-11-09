<template>
  <AppModal
    v-model="open"
    :title="modalTitle"
    :subtitle="comprobanteLabel"
    size="lg"
  >
    <div
      v-if="comprobanteQuery.isLoading.value"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando comprobante...
    </div>

    <div v-else-if="comprobanteDetalle" class="space-y-4">
      <!-- Identidad del documento -->
      <div
        class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="min-w-0">
          <p class="text-xs text-gray-500 dark:text-gray-400">Documento</p>
          <p class="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
            {{ comprobanteDetalle.serie }}-{{ comprobanteDetalle.numero }}
          </p>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <ListaOpcionBadge
              v-if="comprobanteDetalle.nombre_tipo_comprobante || comprobanteDetalle.codigo_tipo_comprobante"
              :value="comprobanteDetalle.nombre_tipo_comprobante ?? comprobanteDetalle.codigo_tipo_comprobante"
            />
            <ListaOpcionBadge
              v-if="comprobanteDetalle.nombre_estado_sunat"
              :value="comprobanteDetalle.nombre_estado_sunat"
            />
          </div>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>{{ tieneVinculos ? 'Los balones y movimientos vinculados se conservan' : 'Al corregir cantidades se ajusta el stock' }}</span>
          <AppHelpTip
            text="Si aumentas cantidad se descuenta stock; si bajas o quitas un producto, se restaura. Las líneas con balón, gas, alquiler o garantía vinculados solo admiten cambio de precio. Si cambia el total, se ajusta el cobro registrado en la caja del día."
          />
        </div>
      </div>

      <!-- Cambio de tipo: boleta ↔ factura en el mismo comprobante -->
      <div
        v-if="puedeConvertirTipo"
        class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">
              ¿Debía ser {{ etiquetaTipoDestino }}?
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Se convierte este mismo comprobante: se conservan stock, cilindros, cobros y la orden de salida.
            </p>
          </div>
          <button
            v-if="!convertirOpen"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            :disabled="saving || convirtiendo"
            @click="abrirConvertir"
          >
            <AppIcon :name="ICONS.refreshCw" :size="14" />
            Convertir a {{ etiquetaTipoDestino }}
          </button>
        </div>

        <div v-if="convertirOpen" class="mt-3 space-y-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AppInput
              v-model="serieDestino"
              label="Serie destino"
              :placeholder="serieDestinoSugerida"
              :disabled="convirtiendo"
            />
            <div>
              <p class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Quedará como</p>
              <p class="flex h-11 items-center text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {{ previewNumeroDestino }}
              </p>
            </div>
          </div>

          <p
            v-if="errorConversion"
            class="rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
          >
            {{ errorConversion }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Toma el siguiente correlativo libre de la serie. El número
            {{ comprobanteDetalle.serie }}-{{ comprobanteDetalle.numero }} queda sin usar (nunca llegó a SUNAT).
            Guarda antes cualquier otro cambio del formulario: al convertir se recarga el comprobante.
          </p>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
              :disabled="convirtiendo"
              @click="convertirOpen = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="convirtiendo || Boolean(errorConversion)"
              @click="onConvertirTipo"
            >
              {{ convirtiendo ? 'Convirtiendo...' : `Convertir a ${etiquetaTipoDestino}` }}
            </button>
          </div>
        </div>
      </div>

      <!-- 1. Cabecera -->
      <DetailSectionCard title="Cabecera" :icon="ICONS.receipt" :full-width="true">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <ClienteSelectField
              v-model="idCliente"
              label="Cliente"
              required
              :disabled="saving || tieneVinculos"
            />
          </div>
          <AppDatePicker
            v-model="fecha"
            label="Fecha"
            :disabled="saving"
            required
          />
          <AlmacenSelectField
            v-model="idAlmacen"
            label="Almacén"
            hint="Desde aquí se descuenta o restaura stock"
            :disabled="saving || tieneVinculos"
            required
          />
        </div>
      </DetailSectionCard>

      <!-- 2. Productos (foco principal) -->
      <DetailSectionCard title="Productos" :icon="ICONS.package" :full-width="true">
        <template #actions>
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ lineas.length }} {{ lineas.length === 1 ? 'ítem' : 'ítems' }}
          </span>
        </template>

        <div class="mb-3">
          <!-- El hint va fuera de la fila: dentro, items-end bajaba el botón de escaneo hasta el texto. -->
          <div class="flex items-end gap-2">
            <div class="min-w-0 flex-1">
              <AppSelectSearch
                v-model="idProductoAgregar"
                v-model:search="productoBuscar"
                remote
                label="Agregar producto"
                placeholder="Buscar y agregar al detalle"
                search-placeholder="Código o nombre..."
                :options="productoOptions"
                :loading="isFetchingProductos"
                :disabled="saving || !idAlmacen"
                :empty-text="productoSelectEmptyText"
              />
            </div>
            <ProductoBarcodeScanButton
              :filters="scanFiltersProducto"
              :disabled="saving || !idAlmacen"
              @scanned="onProductoScanned"
            />
          </div>
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {{ productoSelectHint }}
          </p>
        </div>

        <div
          v-if="lineas.length === 0"
          class="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          No hay productos. Busca arriba para agregar al menos uno.
        </div>

        <div
          v-else
          class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300">
                    Producto
                  </th>
                  <th
                    class="w-28 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300"
                  >
                    Cant.
                  </th>
                  <th
                    class="w-32 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300"
                  >
                    P. unit.
                  </th>
                  <th
                    class="w-28 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300"
                  >
                    Importe
                  </th>
                  <th class="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(linea, index) in lineas"
                  :key="linea.key"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td class="px-3 py-2.5">
                    <p class="font-medium text-gray-800 dark:text-white/90">
                      {{ linea.descripcion || linea.nombreProducto || `Producto ${linea.idProducto}` }}
                    </p>
                    <p
                      v-if="linea.bloqueada"
                      class="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
                    >
                      <AppIcon :name="ICONS.lock" :size="12" />
                      Vinculada a balón/movimiento: solo se corrige el precio
                    </p>

                    <!-- Cilindro de la línea: reemplazo aplicado al guardar -->
                    <div v-if="linea.idBalon" class="mt-1.5 space-y-2">
                      <div class="flex flex-wrap items-center gap-1.5 text-xs">
                        <span class="text-gray-500 dark:text-gray-400">Cilindro</span>
                        <span
                          class="rounded-md bg-gray-100 px-1.5 py-0.5 font-medium tabular-nums text-gray-700 dark:bg-white/10 dark:text-gray-300"
                          :class="{ 'line-through opacity-60': linea.idBalonNuevo }"
                        >
                          {{ linea.codigoBalon || `#${linea.idBalon}` }}
                        </span>
                        <template v-if="linea.idBalonNuevo">
                          <AppIcon :name="ICONS.chevronRight" :size="12" class="text-gray-400" />
                          <span
                            class="rounded-md bg-brand-50 px-1.5 py-0.5 font-semibold tabular-nums text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                          >
                            {{ linea.codigoBalonNuevo || `#${linea.idBalonNuevo}` }}
                          </span>
                          <button
                            type="button"
                            class="text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline dark:text-gray-400"
                            :disabled="saving"
                            @click="deshacerReemplazo(linea)"
                          >
                            Deshacer
                          </button>
                        </template>
                        <button
                          v-else-if="!linea.reemplazando"
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-brand-500/10"
                          :title="motivoNoReemplazable(linea) ?? 'Reemplazar por otro cilindro libre'"
                          :aria-label="`Reemplazar cilindro ${linea.codigoBalon ?? ''}`"
                          :disabled="saving || Boolean(motivoNoReemplazable(linea))"
                          @click="linea.reemplazando = true"
                        >
                          <AppIcon :name="ICONS.replace" :size="14" />
                        </button>
                      </div>

                      <div v-if="linea.reemplazando" class="flex items-end gap-2">
                        <div class="min-w-0 flex-1">
                          <PosBalonSelectField
                            label="Cilindro de reemplazo"
                            placeholder="Mismo tipo de cilindro"
                            mode="general"
                            :id-almacen="idAlmacen"
                            :extra-filters="filtrosReemplazo(linea)"
                            :client-filter="filtroReemplazo(linea)"
                            empty-text="Sin cilindros libres compatibles en el almacén"
                            :disabled="saving"
                            @selected="(b) => onBalonReemplazo(linea, b)"
                          />
                        </div>
                        <button
                          type="button"
                          class="h-11 rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                          @click="linea.reemplazando = false"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-2.5">
                    <CantidadUnidadInput
                      v-model="linea.cantidad"
                      :name="`comprobante-edit-cantidad-${linea.key}`"
                      :nombre-unidad="linea.nombreUnidadMedida"
                      :disabled="saving || linea.bloqueada"
                    />
                  </td>
                  <td class="px-3 py-2.5">
                    <MoneyInput
                      v-model="linea.precioUnitario"
                      placeholder="0.00"
                      :disabled="saving"
                      :state="
                        mensajeErrorMontoMoneda(linea.precioUnitario, { min: 0, allowZero: true })
                          ? 'error'
                          : 'default'
                      "
                      @blur="blurPrecioLinea(linea)"
                    />
                  </td>
                  <td
                    class="px-3 py-2.5 text-right tabular-nums font-medium text-gray-800 dark:text-white/90"
                  >
                    {{ formatMoney(importeLinea(linea)) }}
                  </td>
                  <td class="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      title="Quitar producto"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-error-500/10"
                      :disabled="saving || lineas.length <= 1 || linea.bloqueada"
                      @click="removeLinea(index)"
                    >
                      <AppIcon :name="ICONS.trash" :size="15" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            class="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Total estimado (con IGV en precio)
            </p>
            <p class="text-base font-semibold tabular-nums text-gray-900 dark:text-white">
              {{ formatMoney(totalEstimado) }}
            </p>
          </div>
        </div>
      </DetailSectionCard>

      <!-- Caja: impacto del cambio de total en el cobro registrado -->
      <DetailSectionCard
        v-if="cambiaTotal"
        title="Caja"
        :icon="ICONS.cashRegister"
        :full-width="true"
      >
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total registrado</p>
              <p class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(totalOriginal) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Nuevo total</p>
              <p class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(totalNuevo) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Diferencia</p>
              <p
                class="font-semibold tabular-nums"
                :class="diferenciaTotal > 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'"
              >
                {{ diferenciaTotal > 0 ? '+' : '' }}{{ formatMoney(diferenciaTotal) }}
              </p>
            </div>
          </div>

          <p
            v-if="pagosOriginales.length <= 1"
            class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-400"
          >
            {{ mensajeAjusteCaja }}
          </p>

          <div v-else class="space-y-2">
            <p class="text-xs text-gray-600 dark:text-gray-400">
              La venta se cobró con varios medios de pago. Indica cuánto corresponde a cada uno;
              la suma debe ser igual al nuevo total.
            </p>
            <div
              v-for="pago in pagosEdit"
              :key="pago.id"
              class="flex items-center gap-3"
            >
              <p class="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                {{ pago.nombreMedio }}
                <span v-if="pago.cuenta" class="text-xs text-gray-500 dark:text-gray-400">· {{ pago.cuenta }}</span>
              </p>
              <div class="w-36">
                <MoneyInput
                  v-model="pago.monto"
                  placeholder="0.00"
                  :disabled="saving"
                  :state="mensajeErrorMontoMoneda(pago.monto, { min: 0, allowZero: true }) ? 'error' : 'default'"
                />
              </div>
            </div>
            <p
              class="text-xs font-medium"
              :class="pagosCuadran ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'"
            >
              Suma de pagos: {{ formatMoney(totalPagosEdit) }}
              <template v-if="!pagosCuadran"> — faltan {{ formatMoney(roundMoney(totalNuevo - totalPagosEdit)) }}</template>
            </p>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400">
            Si la caja del {{ fechaCajaLabel }} ya está cerrada, no se podrá guardar: reábrela antes de corregir.
          </p>
        </div>
      </DetailSectionCard>

      <!-- 3. Notas (secundario) -->
      <AppTextarea v-if="esEdicionSegura" v-model="motivoCorreccion" label="Motivo de la corrección" placeholder="Describe el error que estás corrigiendo (mínimo 5 caracteres)" :rows="2" :disabled="saving" />
      <AppCollapsibleSection
        v-model:open="notasOpen"
        title="Notas"
        description="Glosa y observaciones opcionales"
        :icon="ICONS.messageSquare"
        :badge="tieneNotas ? 'Con texto' : undefined"
      >
        <div class="grid grid-cols-1 gap-3">
          <AppInput
            v-model="glosa"
            label="Glosa"
            placeholder="Texto corto en el comprobante"
            :disabled="saving"
            :maxlength="GLOSA_MAX"
            :hint="`${glosa.length}/${GLOSA_MAX} caracteres (límite SUNAT)`"
          />
          <AppTextarea
            v-model="observaciones"
            label="Observaciones"
            placeholder="Notas internas u observaciones"
            :rows="2"
            :disabled="saving"
          />
        </div>
      </AppCollapsibleSection>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        :disabled="saving"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="saving || !canSave"
        @click="confirm"
      >
        <AppIcon v-if="!saving" :name="ICONS.check" :size="16" />
        <AppIcon v-else :name="ICONS.refreshCw" :size="16" class="animate-spin" />
        {{ saving ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComprobanteQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import {
  useConvertirTipoComprobanteMutation,
  useUpdateComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { ListaIds } from '@/shared/constants/lista-ids'
import { useQuery } from '@tanstack/vue-query'
import type {
  CambioBalonLineaPayload,
  ComprobanteListItem,
  OperacionesVsdBalon,
} from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import type {
  Balon,
  BalonListFilters,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import {
  esVentaSinDocumentoTipo,
  LABEL_VENTA_SIN_DOCUMENTO,
} from '@/modules/ventas/comprobantes/constants/tipoComprobante'
import type {
  Producto,
  ProductoListFilters,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import { useProductosCatalogoQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import ProductoBarcodeScanButton from '@/modules/productos/articulos/components/ProductoBarcodeScanButton.vue'
import type { BuscarProductoPorCodigoFilters } from '@/modules/productos/articulos/utils/buscarProductoPorCodigo'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import CantidadUnidadInput from '@/modules/ventas/comprobantes/components/CantidadUnidadInput.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  AppCollapsibleSection,
  AppDatePicker,
  AppHelpTip,
  AppInput,
  AppModal,
  AppSelectSearch,
  AppTextarea,
  ListaOpcionBadge,
  MoneyInput,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { validarStockParaAgregar } from '@/modules/ventas/comprobantes/utils/stockPos'
import {
  filtrosPorCatalogoPos,
  labelCatalogoPosEdicion,
  resolverCatalogoPosEdicion,
  type CatalogoPosEdicion,
} from '@/modules/ventas/comprobantes/utils/catalogoPosEdicion'
import {
  unidadRequiereCantidadEntera,
  validarCantidadSegunUnidad,
} from '@/modules/ventas/comprobantes/utils/unidadMedidaCantidad'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { formatDate } from '@/shared/utils/date'
import { GLOSA_MAX } from '@/shared/constants/facturacion'
import {
  esMontoMonedaValido,
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'

interface LineaEdit {
  item?: number
  idUnidadMedida?: number
  idBalon?: number
  capacidadCilindro?: number
  idEstadoCilindro?: number
  key: string
  idProducto: number
  descripcion: string
  nombreProducto?: string | null
  nombreUnidadMedida?: string | null
  cantidad: number
  precioUnitario: string
  precioUnitarioOriginal?: number
  precioUnitarioInicial?: string
  descuento: number
  porcentajeIgv: number
  idAfectacionIgv?: number
  /** Atada a balón, gas, alquiler o garantía de la venta: solo se corrige el precio. */
  bloqueada: boolean
  codigoBalon?: string | null
  /** Reemplazo elegido; se aplica al guardar (el actual vuelve a DISPONIBLE). */
  idBalonNuevo?: number
  codigoBalonNuevo?: string | null
  /** Selector de reemplazo abierto en esta línea. */
  reemplazando?: boolean
}

interface PagoEdit {
  id: number
  idMedioPago: number
  nombreMedio: string
  cuenta?: string | null
  idCuentaBancaria?: number | null
  numeroOperacion?: string | null
  referencia?: string | null
  observacion?: string | null
  monto: string
}

const props = defineProps<{
  modelValue: boolean
  comprobante: ComprobanteListItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const updateMutation = useUpdateComprobanteMutation()
const saving = computed(() => updateMutation.isPending.value)

const comprobanteId = computed(() => (props.modelValue ? props.comprobante?.id ?? null : null))
const comprobanteQuery = useComprobanteQuery(comprobanteId)

const fecha = ref('')
const glosa = ref('')
const observaciones = ref('')
const motivoCorreccion = ref('')
const idCliente = ref<number | ''>('')
const idAlmacen = ref<number | ''>('')
const lineas = ref<LineaEdit[]>([])
const pagosEdit = ref<PagoEdit[]>([])

const idProductoAgregar = ref<number | ''>('')
const productoBuscar = ref('')
const notasOpen = ref(false)
/** Catálogo POS inferido del detalle al abrir (no cambia al agregar ítems). */
const catalogoPos = ref<CatalogoPosEdicion>('todos')

const productosFilters = ref<ProductoListFilters>({
  pagina: 1,
  limite: 80,
  soloActivos: 1,
  incluirImagenes: false,
})
const productosQuery = useProductosCatalogoQuery(productosFilters)
const isFetchingProductos = computed(() => productosQuery.isFetching.value)
const isProductosError = computed(() => productosQuery.isError.value)

let productoBuscarTimeout: ReturnType<typeof setTimeout> | undefined

const productoSelectHint = computed(() => {
  if (!idAlmacen.value) {
    return 'Selecciona un almacén para listar productos con stock'
  }
  return labelCatalogoPosEdicion(catalogoPos.value)
})

const productoSelectEmptyText = computed(() => {
  if (isProductosError.value) {
    return 'No se pudieron cargar productos. Reintenta.'
  }
  if (isFetchingProductos.value) {
    return 'Cargando productos...'
  }
  return 'Sin resultados'
})

function syncProductosFilters(buscar?: string) {
  productosFilters.value = {
    pagina: 1,
    limite: 80,
    soloActivos: 1,
    incluirImagenes: false,
    buscar: buscar?.trim() || undefined,
    idAlmacen: idAlmacen.value ? Number(idAlmacen.value) : undefined,
    ...filtrosPorCatalogoPos(catalogoPos.value),
  }
}

const scanFiltersProducto = computed<BuscarProductoPorCodigoFilters>(() => ({
  soloActivos: 1,
  idAlmacen: idAlmacen.value ? Number(idAlmacen.value) : undefined,
  ...filtrosPorCatalogoPos(catalogoPos.value),
}))

watch(productoBuscar, (value) => {
  if (productoBuscarTimeout) clearTimeout(productoBuscarTimeout)
  productoBuscarTimeout = setTimeout(() => {
    syncProductosFilters(value)
  }, 300)
})

watch(idAlmacen, () => {
  syncProductosFilters(productoBuscar.value)
})

const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => {
    const base = [producto.codigo, producto.nombre].filter(Boolean).join(' — ')
    if (producto.stock_actual == null) {
      return { value: producto.id, label: base }
    }
    return {
      value: producto.id,
      label: `${base} (stock: ${producto.stock_actual})`,
    }
  }),
)

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const comprobanteDetalle = computed(() => comprobanteQuery.data.value ?? null)
/**
 * Venta con balones, préstamos, orden de salida o garantías: conserva cliente y
 * almacén, y sus líneas vinculadas solo admiten precio. El resto del detalle se
 * puede editar (agregar, quitar, cambiar cantidad). La API valida lo mismo.
 */
const tieneVinculos = computed(() => Boolean(
  comprobanteDetalle.value?.detalles?.some(d => d.id_balon) ||
  comprobanteDetalle.value?.prestamos?.length || comprobanteDetalle.value?.id_doc_salida ||
  comprobanteDetalle.value?.garantias?.length,
))

function lineaVinculada(detalle: {
  id_balon?: number | null
  es_gas?: boolean | null
  es_alquilable?: boolean | null
  es_linea_garantia?: boolean | null
  descripcion?: string | null
}) {
  if (!tieneVinculos.value) return false
  return Boolean(
    detalle.id_balon ||
    detalle.es_gas ||
    detalle.es_alquilable ||
    detalle.es_linea_garantia ||
    /garant[ií]a/i.test(detalle.descripcion ?? ''),
  )
}

const esVsd = computed(() =>
  esVentaSinDocumentoTipo({
    codigo: comprobanteDetalle.value?.codigo_tipo_comprobante ?? props.comprobante?.codigo_tipo_comprobante,
    nombre: comprobanteDetalle.value?.nombre_tipo_comprobante ?? props.comprobante?.nombre_tipo_comprobante,
  }),
)

const modalTitle = computed(() =>
  esVsd.value ? `Corregir ${LABEL_VENTA_SIN_DOCUMENTO.toLowerCase()}` : 'Corregir comprobante antes de emitir',
)
const esEdicionSegura = computed(() => esVsd.value || ['01','03'].includes(comprobanteDetalle.value?.codigo_tipo_comprobante ?? ''))

const comprobanteLabel = computed(() => {
  // El detalle va primero: tras convertir el tipo, la fila del listado aún trae el número viejo.
  const doc = comprobanteDetalle.value ?? props.comprobante
  if (!doc) return undefined
  return `${doc.serie}-${doc.numero}`
})

// ---- Boleta ↔ factura en el mismo comprobante ----
// La API (ven_convertir_tipo_comprobante) valida todo de nuevo; aquí solo se
// adelantan los motivos obvios para no ofrecer un botón que va a fallar.
const convertirMutation = useConvertirTipoComprobanteMutation()
const convirtiendo = computed(() => convertirMutation.isPending.value)
const convertirOpen = ref(false)
const serieDestino = ref('')
const numeroDestinoPreview = ref<string | null>(null)
const tiposComprobanteQuery = useListaOpcionesQuery(ref(ListaIds.TIPO_COMPROBANTE))

const codigoTipoActual = computed(() => comprobanteDetalle.value?.codigo_tipo_comprobante ?? '')
const codigoTipoDestino = computed<'01' | '03'>(() => (codigoTipoActual.value === '01' ? '03' : '01'))
const etiquetaTipoDestino = computed(() => (codigoTipoDestino.value === '01' ? 'factura' : 'boleta'))

const puedeConvertirTipo = computed(() => {
  const doc = comprobanteDetalle.value
  if (!doc || !['01', '03'].includes(codigoTipoActual.value)) return false
  const estado = doc.nombre_estado_sunat ?? ''
  if (estado === 'ACEPTADO' || estado === 'BAJA') return false
  // Con un envío cuyo resultado no está confirmado, SUNAT podría tenerlo.
  const huboEnvio = Boolean(doc.hash_documento || doc.xml_firmado || (doc.ticket_sunat ?? '').trim())
  return !huboEnvio || estado === 'RECHAZADO'
})

const serieDestinoSugerida = computed(() => {
  const actual = (comprobanteDetalle.value?.serie ?? '').trim().toUpperCase()
  const prefijo = codigoTipoDestino.value === '01' ? 'F' : 'B'
  return prefijo + (/^[FB]\d{3}$/.test(actual) ? actual.slice(1) : '001')
})
const serieDestinoFinal = computed(() =>
  (serieDestino.value.trim() || serieDestinoSugerida.value).toUpperCase(),
)

const errorConversion = computed(() => {
  const doc = comprobanteDetalle.value
  if (!doc) return null
  const serie = serieDestinoFinal.value
  const prefijo = codigoTipoDestino.value === '01' ? 'F' : 'B'
  if (serie.length !== 4 || !serie.startsWith(prefijo)) {
    return `La serie de ${etiquetaTipoDestino.value} debe tener 4 caracteres y empezar con ${prefijo} (ej. ${prefijo}001).`
  }
  if (idCliente.value !== doc.id_cliente) {
    return 'Cambiaste el cliente: guarda primero los cambios y luego convierte.'
  }
  if (codigoTipoDestino.value === '01' && !/^\d{11}$/.test((doc.documento_cliente ?? '').trim())) {
    return 'La factura requiere un cliente con RUC (11 dígitos). Cambia el cliente, guarda y luego convierte.'
  }
  return null
})

const previewNumeroDestino = computed(
  () => `${serieDestinoFinal.value}-${numeroDestinoPreview.value ?? '…'}`,
)

let previewTimeout: ReturnType<typeof setTimeout> | undefined
watch(
  [convertirOpen, serieDestinoFinal, codigoTipoDestino, () => tiposComprobanteQuery.data.value],
  () => {
    numeroDestinoPreview.value = null
    clearTimeout(previewTimeout)
    if (!convertirOpen.value || serieDestinoFinal.value.length !== 4) return
    const idTipo = tiposComprobanteQuery.data.value?.find(
      (tipo) => tipo.descripcion === codigoTipoDestino.value,
    )?.id
    if (!idTipo) return
    const serie = serieDestinoFinal.value
    previewTimeout = setTimeout(async () => {
      try {
        const r = await comprobantesService.obtenerSiguienteNumero(idTipo, serie)
        if (serie === serieDestinoFinal.value) numeroDestinoPreview.value = r.numero
      } catch {
        // Solo es una vista previa: la API asigna el número al convertir.
      }
    }, 300)
  },
)

function abrirConvertir() {
  serieDestino.value = serieDestinoSugerida.value
  convertirOpen.value = true
}

async function onConvertirTipo() {
  const doc = comprobanteDetalle.value
  if (!doc || errorConversion.value) return
  const confirmado = window.confirm(
    `Se convertirá ${doc.serie}-${doc.numero} en ${etiquetaTipoDestino.value} ${previewNumeroDestino.value}. ¿Continuar?`,
  )
  if (!confirmado) return
  try {
    await convertirMutation.mutateAsync({
      id: doc.id,
      payload: { codigoTipoDestino: codigoTipoDestino.value, serie: serieDestinoFinal.value },
    })
    convertirOpen.value = false
  } catch {
    // toast en la mutation
  }
}

watch(comprobanteId, () => {
  convertirOpen.value = false
})

const tieneNotas = computed(
  () => Boolean(glosa.value.trim()) || Boolean(observaciones.value.trim()),
)

/** Igual que la API: cantidad × precio − descuento de la línea. */
function importeLinea(linea: LineaEdit) {
  return Number(linea.cantidad) * (parseMoneyInput(linea.precioUnitario) ?? 0) - (linea.descuento || 0)
}

const totalEstimado = computed(() =>
  lineas.value.reduce((acc, linea) => acc + importeLinea(linea), 0),
)

// ---- Caja ----
// La caja suma en vivo los cobros de la venta. Si el total cambia, la API ajusta
// el cobro de un solo medio; con varios medios hay que repartir el nuevo total.
const totalOriginal = computed(() => roundMoney(Number(comprobanteDetalle.value?.total_importe ?? 0)))
const totalNuevo = computed(() => roundMoney(totalEstimado.value))
const diferenciaTotal = computed(() => roundMoney(totalNuevo.value - totalOriginal.value))
const cambiaTotal = computed(() => Boolean(comprobanteDetalle.value) && Math.abs(diferenciaTotal.value) >= 0.01)

const pagosOriginales = computed(() => comprobanteDetalle.value?.pagos ?? [])
const requiereRepartoPagos = computed(() => cambiaTotal.value && pagosOriginales.value.length > 1)
const totalPagosEdit = computed(() =>
  roundMoney(pagosEdit.value.reduce((acc, p) => acc + (parseMoneyInput(p.monto) ?? 0), 0)),
)
const pagosCuadran = computed(() => Math.abs(totalPagosEdit.value - totalNuevo.value) <= 0.01)

const fechaCajaLabel = computed(() => formatDate(fecha.value || comprobanteDetalle.value?.fecha))

const mensajeAjusteCaja = computed(() => {
  const pago = pagosOriginales.value[0]
  if (pago) {
    return `El cobro en ${pago.nombre_medio_pago ?? 'el medio registrado'} se ajustará a ${formatMoney(totalNuevo.value)} y la caja del ${fechaCajaLabel.value} reflejará la diferencia.`
  }
  if (comprobanteDetalle.value?.dias_credito) {
    return 'Venta al crédito: se actualiza la cuenta por cobrar; no mueve efectivo de la caja.'
  }
  return `La caja del ${fechaCajaLabel.value} tomará el nuevo total de la venta.`
})

// ---- Reemplazo de cilindros del detalle ----
// Estado actual de los balones de la venta (el detalle no lo trae). Sin orden de
// salida, se reemplaza uno reservado (PENDIENTE_ENVIO) o uno que ya figura con el
// cliente (venta de mostrador / préstamo): la API corrige el registro al guardar,
// el actual vuelve a DISPONIBLE y el nuevo toma su lugar (y su préstamo).
const ESTADOS_REEMPLAZABLES = new Set(['PENDIENTE_ENVIO', 'EN_PODER_CLIENTE', 'PRESTADO_CLIENTE'])
const admiteCambioBalon = computed(() =>
  ['VSD', 'NV', '01', '03'].includes(comprobanteDetalle.value?.codigo_tipo_comprobante ?? ''),
)
const balonesVentaQuery = useQuery({
  queryKey: computed(() => ['comprobantes', 'operaciones-vsd', comprobanteId.value]),
  queryFn: () => comprobantesService.operacionesVsd(Number(comprobanteId.value)),
  enabled: computed(() =>
    Boolean(comprobanteId.value) &&
    admiteCambioBalon.value &&
    Boolean(comprobanteDetalle.value?.detalles?.some((d) => d.id_balon)),
  ),
  staleTime: 0,
})
const balonesVenta = computed(
  () => new Map((balonesVentaQuery.data.value?.balones ?? []).map((b) => [b.id, b])),
)

function balonActualDe(linea: LineaEdit): OperacionesVsdBalon | undefined {
  return linea.idBalon ? balonesVenta.value.get(linea.idBalon) : undefined
}

function motivoNoReemplazable(linea: LineaEdit): string | null {
  if (!admiteCambioBalon.value) return 'Este tipo de documento no admite reemplazo de cilindro'
  if (comprobanteDetalle.value?.id_doc_salida) return 'La venta ya tiene orden de salida: anúlala para cambiar el cilindro'
  if (balonesVentaQuery.isLoading.value) return 'Cargando estado del cilindro...'
  const balon = balonActualDe(linea)
  if (!balon) return 'No se pudo leer el estado del cilindro'
  if (!ESTADOS_REEMPLAZABLES.has(balon.estado)) {
    return `El cilindro está ${balon.estado.replaceAll('_', ' ').toLowerCase()}: no se puede reemplazar aquí`
  }
  return null
}

/** Balones ya usados por otras líneas (actuales o elegidos), para no repetirlos. */
const balonesOcupados = computed(() => {
  const ids = new Set<number>()
  for (const l of lineas.value) {
    if (l.idBalon) ids.add(l.idBalon)
    if (l.idBalonNuevo) ids.add(l.idBalonNuevo)
  }
  return ids
})

function filtroReemplazo(linea: LineaEdit) {
  return (b: Balon) =>
    b.nombre_estado_balon === 'DISPONIBLE' &&
    (!balonesOcupados.value.has(b.id) || b.id === linea.idBalonNuevo)
}

/** Solo el mismo tipo de cilindro; el gas y el propietario pueden diferir. */
function filtrosReemplazo(linea: LineaEdit): Partial<BalonListFilters> | undefined {
  const actual = balonActualDe(linea)
  return actual ? { idTipoBalon: actual.id_tipo_balon } : undefined
}

function onBalonReemplazo(linea: LineaEdit, balon: Balon | null) {
  if (!balon) return
  if (balon.id === linea.idBalon) {
    deshacerReemplazo(linea)
    return
  }
  linea.idBalonNuevo = balon.id
  linea.codigoBalonNuevo = balon.codigo_balon
  linea.reemplazando = false
}

function deshacerReemplazo(linea: LineaEdit) {
  linea.idBalonNuevo = undefined
  linea.codigoBalonNuevo = null
  linea.reemplazando = false
}

const cambiosBalon = computed<CambioBalonLineaPayload[]>(() =>
  lineas.value
    .filter((l) => l.idBalon && l.idBalonNuevo && l.idBalonNuevo !== l.idBalon)
    .map((l) => ({ idBalonActual: l.idBalon!, idBalonNuevo: l.idBalonNuevo! })),
)

const canSave = computed(
  () =>
    (!requiereRepartoPagos.value || pagosCuadran.value) &&
    (!esEdicionSegura.value || comprobanteDetalle.value?.permite_edicion_segura === true) &&
    Boolean(fecha.value) &&
    Boolean(idCliente.value) &&
    Boolean(idAlmacen.value) &&
    lineas.value.length > 0 &&
    lineas.value.every(
      (l) =>
        l.cantidad > 0 &&
        esMontoMonedaValido(l.precioUnitario, { min: 0, allowZero: true }),
    ),
)

watch(
  () => comprobanteQuery.data.value,
  (data) => {
    if (!data) return
    fecha.value = String(data.fecha ?? '').slice(0, 10)
    glosa.value = String(data.glosa ?? '').slice(0, GLOSA_MAX)
    observaciones.value = data.observaciones ?? ''
    motivoCorreccion.value = ''
    idCliente.value = data.id_cliente ?? ''
    idAlmacen.value = data.id_almacen ?? ''
    lineas.value = (data.detalles ?? []).map((detalle, index) => ({
      item: detalle.item,
      idUnidadMedida: detalle.id_unidad_medida ?? undefined,
      idBalon: detalle.id_balon ?? undefined,
      capacidadCilindro: detalle.capacidad_cilindro != null ? Number(detalle.capacidad_cilindro) : undefined,
      idEstadoCilindro: detalle.id_estado_cilindro ?? undefined,
      key: `${detalle.id ?? detalle.id_producto}-${index}`,
      idProducto: detalle.id_producto,
      descripcion: detalle.descripcion ?? '',
      nombreProducto: detalle.nombre_producto,
      nombreUnidadMedida: detalle.nombre_unidad_medida ?? null,
      cantidad: Number(detalle.cantidad),
      precioUnitario: roundMoney(Number(detalle.precio_unitario)).toFixed(2),
      precioUnitarioOriginal: Number(detalle.precio_unitario),
      precioUnitarioInicial: roundMoney(Number(detalle.precio_unitario)).toFixed(2),
      descuento: Number(detalle.descuento ?? 0),
      porcentajeIgv: Number(detalle.porcentaje_igv ?? 18),
      idAfectacionIgv: detalle.id_afectacion_igv ?? undefined,
      bloqueada: lineaVinculada(detalle),
      codigoBalon: detalle.codigo_balon ?? null,
    }))
    pagosEdit.value = (data.pagos ?? []).map((pago) => ({
      id: pago.id,
      idMedioPago: pago.id_medio_pago,
      nombreMedio: pago.nombre_medio_pago ?? `Medio ${pago.id_medio_pago}`,
      cuenta: pago.cuenta_bancaria,
      idCuentaBancaria: pago.id_cuenta_bancaria,
      numeroOperacion: pago.numero_operacion,
      referencia: pago.referencia,
      observacion: pago.observacion,
      monto: roundMoney(Number(pago.monto)).toFixed(2),
    }))
    idProductoAgregar.value = ''
    productoBuscar.value = ''
    notasOpen.value = Boolean((data.glosa ?? '').trim() || (data.observaciones ?? '').trim())
    catalogoPos.value = resolverCatalogoPosEdicion({
      origenPos: data.origen_pos,
      detalles: data.detalles ?? [],
    })
    syncProductosFilters('')
  },
  { immediate: true },
)

watch(idProductoAgregar, (id) => {
  if (id === '' || id == null) return
  const selectedId = Number(id)
  idProductoAgregar.value = ''

  if (!idAlmacen.value) {
    toastWarning('Selecciona el almacén antes de agregar productos')
    return
  }

  const producto = (productosQuery.data.value?.data ?? []).find((item) => item.id === selectedId)
  if (!producto) {
    toastWarning('No se pudo cargar el producto seleccionado. Intenta de nuevo.')
    return
  }
  agregarProducto(producto)
})

function onProductoScanned(producto: Producto) {
  if (!idAlmacen.value) {
    toastWarning('Selecciona el almacén antes de agregar productos')
    return
  }
  agregarProducto(producto)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function blurPrecioLinea(linea: LineaEdit) {
  const n = parseMoneyInput(linea.precioUnitario)
  if (n != null) linea.precioUnitario = roundMoney(n).toFixed(2)
}

function removeLinea(index: number) {
  if (lineas.value.length <= 1) {
    toastWarning('Debe quedar al menos un producto')
    return
  }
  lineas.value.splice(index, 1)
}

function agregarProducto(producto: Producto) {
  // Una línea vinculada no cambia de cantidad: el producto entra como línea nueva.
  const existente = lineas.value.find(
    (linea) => linea.idProducto === producto.id && !linea.bloqueada,
  )
  const unidad = producto.nombre_unidad_medida ?? null
  const incremento = unidadRequiereCantidadEntera(unidad) ? 1 : 0.01
  const cantidadDeseada = existente
    ? Math.max(incremento, Number(existente.cantidad || 0) + incremento)
    : 1

  const errorStock = validarStockParaAgregar(producto, cantidadDeseada, {
    requiereAlmacenSeleccionado: true,
  })
  if (errorStock) {
    toastWarning(errorStock)
    return
  }

  if (existente) {
    existente.cantidad = cantidadDeseada
    existente.nombreUnidadMedida = unidad ?? existente.nombreUnidadMedida
    toastSuccess(`${producto.nombre}: cantidad ${existente.cantidad}`)
    return
  }

  const afectacionDefault = lineas.value.find((l) => l.idAfectacionIgv)?.idAfectacionIgv
  lineas.value.push({
    key: crypto.randomUUID(),
    idProducto: producto.id,
    descripcion: producto.nombre,
    nombreUnidadMedida: unidad,
    cantidad: 1,
    precioUnitario: roundMoney(Number(producto.precio ?? 0)).toFixed(2),
    descuento: 0,
    porcentajeIgv: 18,
    idAfectacionIgv: afectacionDefault,
    bloqueada: false,
  })
  toastSuccess(`${producto.nombre} agregado`)
}

async function confirm() {
  if (esEdicionSegura.value && motivoCorreccion.value.trim().length < 5) {
    toastWarning('Describe el motivo de la corrección con al menos 5 caracteres')
    return
  }
  const row = props.comprobante
  const userId = authStore.user?.id
  if (!row || !userId || !canSave.value) return

  if (lineas.value.some((l) => !l.idProducto || l.cantidad <= 0)) {
    toastWarning('Revisa cantidades y productos del detalle')
    return
  }

  for (const linea of lineas.value) {
    const errorCantidad = validarCantidadSegunUnidad(
      Number(linea.cantidad),
      linea.nombreUnidadMedida,
      linea.descripcion,
    )
    if (errorCantidad) {
      toastWarning(errorCantidad)
      return
    }
    const errorPrecio = mensajeErrorMontoMoneda(linea.precioUnitario, { min: 0, allowZero: true })
    if (errorPrecio) {
      toastWarning(`El precio de "${linea.descripcion}": ${errorPrecio}`)
      return
    }
  }

  if (!idAlmacen.value) {
    toastWarning('Selecciona el almacén')
    return
  }

  if (requiereRepartoPagos.value && !pagosCuadran.value) {
    toastWarning(`Los pagos deben sumar el nuevo total (${formatMoney(totalNuevo.value)})`)
    return
  }

  try {
    await updateMutation.mutateAsync({
      id: row.id,
      payload: {
        motivoCorreccion: esEdicionSegura.value ? motivoCorreccion.value.trim() : undefined,
        versionEsperada: comprobanteDetalle.value?.version,
        idUsuarioAuditoria: userId,
        idCliente: Number(idCliente.value) || undefined,
        idAlmacen: Number(idAlmacen.value) || undefined,
        fecha: fecha.value,
        glosa: glosa.value.trim().slice(0, GLOSA_MAX) || undefined,
        observaciones: observaciones.value.trim() || undefined,
        detalles: lineas.value.map((linea) => ({
          item: linea.item,
          idUnidadMedida: linea.idUnidadMedida,
          idBalon: linea.idBalonNuevo ?? linea.idBalon,
          capacidadCilindro: linea.capacidadCilindro,
          idEstadoCilindro: linea.idEstadoCilindro,
          idProducto: linea.idProducto,
          cantidad: Number(linea.cantidad),
          precioUnitario: linea.precioUnitario === linea.precioUnitarioInicial && linea.precioUnitarioOriginal != null
            ? linea.precioUnitarioOriginal : roundMoney(parseMoneyInput(linea.precioUnitario) ?? 0),
          descuento: linea.descuento || undefined,
          porcentajeIgv: linea.porcentajeIgv,
          idAfectacionIgv: linea.idAfectacionIgv,
          descripcion: linea.descripcion,
        })),
        cambiosBalon: cambiosBalon.value.length ? cambiosBalon.value : undefined,
        // Solo con cobro mixto y total distinto; con un medio la API ajusta el monto.
        pagos: requiereRepartoPagos.value
          ? pagosEdit.value
              .map((pago) => ({
                idMedioPago: pago.idMedioPago,
                monto: roundMoney(parseMoneyInput(pago.monto) ?? 0),
                idCuentaBancaria: pago.idCuentaBancaria ?? undefined,
                numeroOperacion: pago.numeroOperacion ?? undefined,
                referencia: pago.referencia ?? undefined,
                observacion: pago.observacion ?? undefined,
              }))
              .filter((pago) => pago.monto > 0)
          : undefined,
      },
    })
    open.value = false
  } catch {
    // toast en la mutación
  }
}
</script>
