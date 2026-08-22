<template>
  <div
    v-if="isEdit && productoQuery.isLoading.value"
    class="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
  >
    Cargando producto...
  </div>

  <div
    v-else-if="isEdit && !producto"
    class="rounded-2xl border border-error-200 bg-error-50 px-4 py-6 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
  >
    No se encontró el producto solicitado.
  </div>

  <form
    v-else
    id="producto-form"
    class="space-y-5"
    autocomplete="off"
    @submit="onSubmit"
  >
    <div
      v-if="esProductoDeSistema"
      class="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200"
    >
      Producto de sistema ({{ producto?.codigo }}). Se usa internamente en el POS; no se edita ni
      elimina como un artículo de catálogo.
    </div>

    <FormCardsLayout>
      <DetailSectionCard
        title="Datos"
        :icon="ICONS.package"
        help="Producto: accesorio o gas. Servicio: cobro (flete, etc.), taller de cilindro, o regulador alquilable."
      >
        <div class="grid grid-cols-1 !gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="sm:col-span-2 lg:col-span-1">
            <p class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition"
                :class="tipoItemCardClass('producto')"
                :disabled="isSubmitting"
                @click="setTipoItem('producto')"
              >
                <AppIcon :name="ICONS.package" :size="16" />
                Producto
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition"
                :class="tipoItemCardClass('servicio')"
                :disabled="isSubmitting"
                @click="setTipoItem('servicio')"
              >
                <AppIcon :name="ICONS.wrench" :size="16" />
                Servicio
              </button>
            </div>
          </div>

          <div class="flex min-w-0 items-start gap-2">
            <div class="min-w-0 flex-1">
              <AppInput
                v-model="codigo"
                label="Código"
                placeholder="PRO-001"
                required
                help="Se asigna automáticamente (PRO / SER / GAS). No se edita a mano; usa Generar para el siguiente correlativo."
                v-bind="codigoAttrs"
                :disabled="true"
                :error="errors.codigo"
              />
            </div>
            <button
              v-if="!esProductoDeSistema && !isEdit"
              type="button"
              class="mt-[1.625rem] inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-brand-500 px-3.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSubmitting || isGeneratingCodigo"
              title="Generar siguiente código"
              @click="generarCodigoProducto(true)"
            >
              {{ isGeneratingCodigo ? '…' : 'Generar' }}
            </button>
          </div>

          <AppInput
            v-model="nombre"
            label="Nombre"
            placeholder="Oxígeno industrial"
            required
            v-bind="nombreAttrs"
            :disabled="isSubmitting"
            :error="errors.nombre"
          />

          <div class="flex min-w-0 items-start gap-2">
            <div class="min-w-0 flex-1">
              <AppInput
                v-model="codigoBarra"
                label="Código de barras"
                optional
                placeholder="Opcional"
                help="Puedes escanearlo con la pistola usando el botón de al lado."
                v-bind="codigoBarraAttrs"
                :disabled="isSubmitting"
              />
            </div>
            <button
              type="button"
              title="Escanear con pistola"
              aria-label="Escanear código de barras"
              class="mt-[1.625rem] inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
              :disabled="isSubmitting"
              @click="barcodeScanOpen = true"
            >
              <AppIcon :name="ICONS.scanBarcode" :size="18" />
            </button>
          </div>

          <BarcodeCaptureModal
            v-model="barcodeScanOpen"
            title="Escanear código de barras"
            subtitle="Apunta la pistola al código del producto y pulsa Enter."
            @captured="onCodigoBarraScanned"
          />

          <AppInput
            v-model="marca"
            label="Marca"
            optional
            placeholder="Opcional"
            v-bind="marcaAttrs"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="presentacion"
            label="Presentación"
            optional
            placeholder="Ej. Cilindro 10 m³"
            v-bind="presentacionAttrs"
            :disabled="isSubmitting"
          />

          <div class="flex min-w-0 items-start gap-2">
            <div class="min-w-0 flex-1">
              <AppInput
                v-model="codigoUbicacion"
                label="Código de ubicación"
                optional
                placeholder="Ej. ARO-GEN-01"
                :help="
                  tipoItem === 'servicio'
                    ? 'Los servicios no usan ubicación en almacén.'
                    : 'Iniciales de nombre y marca (ej. ARO-GEN-01). En edición se guarda al generar.'
                "
                v-bind="codigoUbicacionAttrs"
                :disabled="isSubmitting || isGeneratingUbicacion || tipoItem === 'servicio'"
              />
            </div>
            <button
              type="button"
              class="mt-[1.625rem] inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-brand-500 px-3.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSubmitting || isGeneratingUbicacion || tipoItem === 'servicio'"
              @click="generarCodigoUbicacion"
            >
              {{ isGeneratingUbicacion ? '…' : 'Generar' }}
            </button>
          </div>

          <AppSelectWithCreate
            :can-create="canCreateCategoria"
            create-title="Nueva categoría"
            :disabled="isSubmitting"
            @create="categoriaModalOpen = true"
          >
            <AppSelect
              v-model="idCategoria"
              label="Categoría"
              optional
              placeholder="Selecciona categoría"
              v-bind="idCategoriaAttrs"
              :disabled="isSubmitting"
              :options="categoriaOptions"
            />
          </AppSelectWithCreate>

          <AppSelectWithCreate
            :can-create="canCreateSubCategoria"
            create-title="Nueva subcategoría"
            :disabled="isSubmitting || !idCategoria"
            @create="subCategoriaModalOpen = true"
          >
            <AppSelect
              v-model="idSubCategoria"
              label="Subcategoría"
              optional
              placeholder="Selecciona subcategoría"
              v-bind="idSubCategoriaAttrs"
              :disabled="isSubmitting || !idCategoria"
              :options="subCategoriaOptions"
            />
          </AppSelectWithCreate>

          <AppSelectWithCreate
            :can-create="canCreateUnidad"
            create-title="Nueva unidad de medida"
            :disabled="isSubmitting || unidadesMedidaQuery.isFetching.value"
            @create="unidadModalOpen = true"
          >
            <AppSelect
              v-model="idUnidadMedida"
              label="Unidad de medida"
              optional
              placeholder="Selecciona unidad"
              v-bind="idUnidadMedidaAttrs"
              :disabled="isSubmitting || unidadesMedidaQuery.isFetching.value"
              :options="unidadMedidaOptions"
            />
          </AppSelectWithCreate>
        </div>
      </DetailSectionCard>

      <DetailSectionCard
        title="Comercial"
        :icon="ICONS.creditCard"
        :help="ayudaCaracteristicas"
      >
        <div class="grid grid-cols-1 !gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-3">
            <div class="flex flex-wrap gap-x-5 gap-y-2">
              <AppCheckbox
                v-if="tipoItem === 'producto'"
                v-model="esGas"
                :disabled="isSubmitting"
                label="Es gas"
              />
              <AppCheckbox
                v-model="esAlquilable"
                :disabled="isSubmitting"
                label="Alquilable"
              />
              <AppCheckbox
                v-if="tipoItem === 'servicio' && !esAlquilable"
                v-model="esMantenimiento"
                :disabled="isSubmitting"
                label="Entra a taller (mantenimiento de cilindro)"
              />
              <AppCheckbox
                v-if="tipoItem === 'producto' && !esGas"
                v-model="afectaStock"
                :disabled="isSubmitting"
                label="Afecta stock"
              />
            </div>
          </div>

          <AppInput
            v-if="tipoItem === 'producto' && esGas"
            v-model="factorKgM3"
            label="Factor kg / m³"
            type="number"
            min="0"
            step="0.000001"
            placeholder="Ej. 0.75"
            help="m³ de gas por 1 kg (ficha técnica)."
            :disabled="isSubmitting"
            :error="errors.factorKgM3"
          />
          <AppInput
            v-if="tipoItem === 'producto' && esGas"
            v-model="factorLbM3"
            label="Factor lb / m³"
            type="number"
            min="0"
            step="0.000001"
            placeholder="Ej. 0.3174"
            help="m³ de gas por 1 lb. Fallback si el tipo no tiene capacidad lb."
            :disabled="isSubmitting"
            :error="errors.factorLbM3"
          />

          <AppFormField label="Precio de venta" :error="errors.precio">
            <MoneyInput
              v-model="precio"
              v-bind="precioAttrs"
              placeholder="0.00"
              :disabled="isSubmitting"
              :state="errors.precio ? 'error' : 'default'"
              @blur="onMoneyBlur('precio', precioAttrs.onBlur)"
            />
          </AppFormField>

          <AppFormField label="Precio de compra" :error="errors.precioCompra">
            <MoneyInput
              v-model="precioCompra"
              v-bind="precioCompraAttrs"
              placeholder="0.00"
              :disabled="isSubmitting || tipoItem === 'servicio'"
              :state="errors.precioCompra ? 'error' : 'default'"
              @blur="onMoneyBlur('precioCompra', precioCompraAttrs.onBlur)"
            />
          </AppFormField>

          <AppFormField
            v-if="muestraGarantiaDeposito"
            label="Garantía / depósito"
            help="Depósito reembolsable al alquilar un accesorio o prestar un cilindro (gas). No aplica a productos de venta/stock normal."
            :error="errors.precioGarantia"
          >
            <MoneyInput
              v-model="precioGarantia"
              v-bind="precioGarantiaAttrs"
              placeholder="0.00"
              :disabled="isSubmitting"
              :state="errors.precioGarantia ? 'error' : 'default'"
              @blur="onMoneyBlur('precioGarantia', precioGarantiaAttrs.onBlur)"
            />
          </AppFormField>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Imágenes" :icon="ICONS.images">
        <ProductoImagenesManager
          v-if="isEdit && producto?.id"
          :id-producto="producto.id"
          editable
        />

        <AppDropzone
          v-else
          v-model="pendingImages"
          title="Arrastra imágenes o selecciónalas"
          description="PNG, JPG, WEBP o GIF. Hasta 20 archivos."
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif"
          multiple
          :max-files="20"
          :max-filesize="10"
          :disabled="isSubmitting"
        />
      </DetailSectionCard>
    </FormCardsLayout>

    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting || esProductoDeSistema"
      >
        {{ isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear' }}
      </button>
    </div>
  </form>

  <CategoriaProductoFormModal
    v-model="categoriaModalOpen"
    mode="create"
    @saved="onCategoriaCreated"
  />

  <SubCategoriaProductoFormModal
    v-model="subCategoriaModalOpen"
    mode="create"
    :categorias="categorias"
    :default-categoria-id="idCategoria ? Number(idCategoria) : null"
    lock-categoria
    @saved="onSubCategoriaCreated"
  />

  <ListaOpcionFormModal
    v-model="unidadModalOpen"
    :id-lista="ListaIds.UNIDAD_MEDIDA"
    title="Nueva unidad de medida"
    subtitle="Quedará disponible en productos y tipos de balón."
    nombre-placeholder="Ej. m³, L, kg, UNID"
    @saved="onUnidadCreated"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useProductoDetailQuery } from '@/modules/productos/articulos/composables/useProductoDetailQuery'
import {
  useCreateProductoMutation,
  useUpdateProductoMutation,
} from '@/modules/productos/articulos/composables/useProductoMutations'
import ProductoImagenesManager from '@/modules/productos/articulos/components/ProductoImagenesManager.vue'
import BarcodeCaptureModal from '@/modules/productos/articulos/components/BarcodeCaptureModal.vue'
import { productoImagenesQueryKeys } from '@/modules/productos/articulos/constants/productoImagenesQueryKeys'
import { productosQueryKeys } from '@/modules/productos/articulos/constants/productosQueryKeys'
import type {
  Producto,
  ProductoFormMode,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import { productoImagenesService } from '@/modules/productos/articulos/services/producto-imagenes.service'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import {
  codigoProductoSistema,
  esProductoSistema,
} from '@/modules/productos/articulos/utils/productosSistema'
import CategoriaProductoFormModal from '@/modules/productos/categorias/components/CategoriaProductoFormModal.vue'
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import SubCategoriaProductoFormModal from '@/modules/productos/sub-categorias/components/SubCategoriaProductoFormModal.vue'
import { subCategoriasProductoService } from '@/modules/productos/sub-categorias/services/sub-categorias-producto.service'
import type { SubCategoriaProducto } from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import {
  AppCheckbox,
  AppDropzone,
  AppFormField,
  AppInput,
  AppSelect,
  AppSelectWithCreate,
  MoneyInput,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'
import {
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'
import { yupMontoMoneda } from '@/shared/utils/yupMoney'

type TipoItem = 'producto' | 'servicio'
type MoneyField = 'precio' | 'precioCompra' | 'precioGarantia'

const moneyFieldOpts = { min: 0, allowZero: true } as const

const props = withDefaults(
  defineProps<{
    mode: ProductoFormMode
    productoId?: number
    active?: boolean
  }>(),
  {
    active: true,
  },
)

const emit = defineEmits<{
  saved: [producto: Producto]
  cancel: []
}>()

const authStore = useAuthStore()
const queryClient = useQueryClient()

const isEdit = computed(() => props.mode === 'edit')
const idParaEditar = computed(() => (props.mode === 'edit' ? props.productoId : undefined))
const activeRef = toRef(props, 'active')
const productoQuery = useProductoDetailQuery(idParaEditar, activeRef)
const producto = computed(() => productoQuery.data.value ?? null)
const esProductoDeSistema = computed(() => esProductoSistema(producto.value))

const categorias = ref<CategoriaProducto[]>([])
const subCategorias = ref<SubCategoriaProducto[]>([])
const tipoItem = ref<TipoItem>('producto')
const pendingImages = ref<File[]>([])
const isGeneratingUbicacion = ref(false)
const isGeneratingCodigo = ref(false)
const barcodeScanOpen = ref(false)
const formHydrated = ref(false)
const categoriaModalOpen = ref(false)
const subCategoriaModalOpen = ref(false)
const unidadModalOpen = ref(false)

const canCreateCategoria = computed(() =>
  authStore.hasPermission(PermisoBanderas.CATEGORIAS_CREAR),
)
const canCreateSubCategoria = computed(() =>
  authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_CREAR),
)
const canCreateUnidad = computed(() => Boolean(authStore.user?.id))

const listaUnidadMedidaId = ref(ListaIds.UNIDAD_MEDIDA)
const unidadesMedidaQuery = useListaOpcionesQuery(listaUnidadMedidaId)
const createMutation = useCreateProductoMutation()
const updateMutation = useUpdateProductoMutation()

const categoriaOptions = computed(() =>
  categorias.value.map((categoria) => ({
    value: categoria.id,
    label: categoria.nombre,
  })),
)

const unidadMedidaOptions = computed(() =>
  (unidadesMedidaQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
)

const ayudaCaracteristicas = computed(() => {
  if (tipoItem.value === 'servicio') {
    if (esAlquilable.value) {
      return 'Servicio alquilable: aparecerá en POS Medicinal (regulador) y en el formulario de alquileres.'
    }
    if (esMantenimiento.value) {
      return 'Taller: en el POS pide cilindro y crea el mantenimiento en Balones. El resto de servicios no.'
    }
    return 'Solo cobro: flete u otro servicio. Entra al comprobante y no crea nada en taller.'
  }
  if (esGas.value) {
    return 'Gas: solo precio para vender. La cantidad disponible está en Balones / Stock de gas.'
  }
  return 'Producto: al guardar se crea stock en 0 en cada almacén activo. Las cantidades se cambian con Movimientos.'
})

const { defineField, handleSubmit, resetForm, errors, isSubmitting, values, setFieldValue } =
  useForm({
    validationSchema: toTypedSchema(
      yup.object({
        codigo: requiredString('El código'),
        codigoBarra: optionalString(),
        codigoUbicacion: optionalString(),
        nombre: requiredString('El nombre'),
        idCategoria: yup.number().optional(),
        idSubCategoria: yup.number().optional(),
        idUnidadMedida: yup.number().optional(),
        marca: optionalString(),
        presentacion: optionalString(),
        esGas: yup.boolean().default(false),
        esServicio: yup.boolean().default(false),
        esAlquilable: yup.boolean().default(false),
        esMantenimiento: yup.boolean().default(false),
        afectaStock: yup.boolean().default(true),
        precio: yupMontoMoneda({ optional: true, ...moneyFieldOpts }),
        precioCompra: yupMontoMoneda({ optional: true, ...moneyFieldOpts }),
        precioGarantia: yupMontoMoneda({ optional: true, ...moneyFieldOpts }),
        factorKgM3: optionalNumber().min(0, 'El factor kg / m³ no puede ser negativo'),
        factorLbM3: optionalNumber().min(0, 'El factor lb / m³ no puede ser negativo'),
      }),
    ),
    initialValues: {
      codigo: '',
      codigoBarra: '',
      codigoUbicacion: '',
      nombre: '',
      idCategoria: undefined as number | undefined,
      idSubCategoria: undefined as number | undefined,
      idUnidadMedida: undefined as number | undefined,
      marca: '',
      presentacion: '',
      esGas: false,
      esServicio: false,
      esAlquilable: false,
      esMantenimiento: false,
      afectaStock: true,
      precio: '',
      precioCompra: '',
      precioGarantia: '',
      factorKgM3: undefined as number | undefined,
      factorLbM3: undefined as number | undefined,
    },
  })

const [codigo, codigoAttrs] = defineField('codigo')
const [codigoBarra, codigoBarraAttrs] = defineField('codigoBarra')
const [codigoUbicacion, codigoUbicacionAttrs] = defineField('codigoUbicacion')
const [nombre, nombreAttrs] = defineField('nombre')
const [idCategoria, idCategoriaAttrs] = defineField('idCategoria')
const [idSubCategoria, idSubCategoriaAttrs] = defineField('idSubCategoria')
const [idUnidadMedida, idUnidadMedidaAttrs] = defineField('idUnidadMedida')
const [marca, marcaAttrs] = defineField('marca')
const [presentacion, presentacionAttrs] = defineField('presentacion')
const [esGas] = defineField('esGas')
defineField('esServicio')
const [esAlquilable] = defineField('esAlquilable')
const [esMantenimiento] = defineField('esMantenimiento')
const [afectaStock] = defineField('afectaStock')
const [precio, precioAttrs] = defineField('precio')
const [precioCompra, precioCompraAttrs] = defineField('precioCompra')
const [precioGarantia, precioGarantiaAttrs] = defineField('precioGarantia')

/** Garantía solo aplica a alquiler de accesorio o préstamo de cilindro (gas). */
const muestraGarantiaDeposito = computed(
  () => Boolean(esAlquilable.value) || Boolean(esGas.value),
)
const [factorKgM3] = defineField('factorKgM3')
const [factorLbM3] = defineField('factorLbM3')

function formatMoneyField(value?: number | null): string {
  if (value == null) return ''
  return roundMoney(value).toFixed(2)
}

function onMoneyBlur(field: MoneyField, veeBlur?: (e: Event) => void) {
  const raw = values[field] ?? ''
  const texto = String(raw).trim()
  if (!texto) {
    setFieldValue(field, '')
  } else if (!mensajeErrorMontoMoneda(texto, moneyFieldOpts)) {
    const n = parseMoneyInput(texto)
    if (n != null) setFieldValue(field, roundMoney(n).toFixed(2))
  }
  veeBlur?.(new Event('blur'))
}

const subCategoriaOptions = computed(() =>
  subCategorias.value
    .filter((subCategoria) =>
      values.idCategoria ? subCategoria.id_categoria === Number(values.idCategoria) : true,
    )
    .map((subCategoria) => ({
      value: subCategoria.id,
      label: subCategoria.nombre,
    })),
)

function tipoItemCardClass(tipo: TipoItem) {
  const active = tipoItem.value === tipo
  return active
    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:border-brand-400 dark:bg-brand-500/10'
    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700'
}

function setTipoItem(tipo: TipoItem, options?: { regenerarCodigo?: boolean }) {
  tipoItem.value = tipo
  if (tipo === 'servicio') {
    setFieldValue('esServicio', true)
    setFieldValue('esGas', false)
    setFieldValue('afectaStock', false)
    setFieldValue('precioCompra', '')
  } else {
    setFieldValue('esServicio', false)
    setFieldValue('esMantenimiento', false)
    setFieldValue('afectaStock', true)
  }
  if (
    options?.regenerarCodigo !== false &&
    !isEdit.value &&
    esCodigoAutoGenerado(codigo.value)
  ) {
    void generarCodigoProducto(false)
  }
}

function esCodigoAutoGenerado(value: string | undefined | null): boolean {
  const codigoActual = (value ?? '').trim().toUpperCase()
  return codigoActual === '' || /^(PRO|SER|GAS)-\d+$/.test(codigoActual)
}

async function generarCodigoProducto(mostrarToast: boolean) {
  if (esProductoDeSistema.value) return

  isGeneratingCodigo.value = true
  try {
    const result = await productosService.generarCodigoProducto({
      esServicio: tipoItem.value === 'servicio',
      esGas: tipoItem.value === 'producto' && Boolean(esGas.value),
    })
    codigo.value = result.codigo
    if (mostrarToast) {
      toastSuccess(`Código asignado: ${result.codigo}`)
    }
  } catch (error) {
    toastApiError(error, 'No se pudo generar el código del producto')
  } finally {
    isGeneratingCodigo.value = false
  }
}

function syncFormFromProducto() {
  const data = producto.value
  if (!data) return

  tipoItem.value = data.es_servicio ? 'servicio' : 'producto'
  resetForm({
    values: {
      codigo: data.codigo ?? '',
      codigoBarra: data.codigo_barra ?? '',
      codigoUbicacion: data.codigo_ubicacion ?? '',
      nombre: data.nombre ?? '',
      idCategoria: data.id_categoria ?? undefined,
      idSubCategoria: data.id_sub_categoria ?? undefined,
      idUnidadMedida: data.id_unidad_medida ?? undefined,
      marca: data.marca ?? '',
      presentacion: data.presentacion ?? '',
      esGas: data.es_gas ?? false,
      esServicio: data.es_servicio ?? false,
      esAlquilable: data.es_alquilable ?? false,
      esMantenimiento: Boolean(data.es_mantenimiento),
      afectaStock:
        data.es_servicio || data.es_gas ? false : (data.afecta_stock ?? true),
      precio: formatMoneyField(data.precio),
      precioCompra: formatMoneyField(data.precio_compra),
      precioGarantia: formatMoneyField(data.precio_garantia),
      factorKgM3: data.factor_kg_m3 != null ? Number(data.factor_kg_m3) : undefined,
      factorLbM3: data.factor_lb_m3 != null ? Number(data.factor_lb_m3) : undefined,
    },
  })
  formHydrated.value = true
}

async function loadCatalogos() {
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

function onCodigoBarraScanned(codigo: string) {
  codigoBarra.value = codigo
  toastSuccess(`Código de barras: ${codigo}`)
}

function onCategoriaCreated(categoria: CategoriaProducto) {
  if (!categorias.value.some((item) => item.id === categoria.id)) {
    categorias.value = [categoria, ...categorias.value]
  }
  idCategoria.value = categoria.id
}

function onSubCategoriaCreated(subCategoria: SubCategoriaProducto) {
  if (!subCategorias.value.some((item) => item.id === subCategoria.id)) {
    subCategorias.value = [subCategoria, ...subCategorias.value]
  }
  if (subCategoria.id_categoria) {
    idCategoria.value = subCategoria.id_categoria
  }
  idSubCategoria.value = subCategoria.id
}

function onUnidadCreated(opcion: ListaOpcion) {
  idUnidadMedida.value = opcion.id
}

const generarCodigoUbicacion = async () => {
  const nombreActual = (nombre.value ?? '').trim()
  if (!nombreActual) {
    toastApiError(new Error('Ingresa el nombre del producto antes de generar'), 'Nombre requerido')
    return
  }

  isGeneratingUbicacion.value = true
  try {
    const persistir = isEdit.value && producto.value?.id != null
    const result = await productosService.generarCodigoUbicacion({
      nombre: nombreActual,
      marca: (marca.value ?? '').trim() || undefined,
      idProducto: persistir ? producto.value!.id : undefined,
    })

    codigoUbicacion.value = result.codigo_ubicacion

    if (persistir) {
      await queryClient.invalidateQueries({ queryKey: productosQueryKeys.all })
      toastSuccess(`Ubicación asignada: ${result.codigo_ubicacion}`)
    } else {
      toastSuccess(`Código sugerido: ${result.codigo_ubicacion}`)
    }
  } catch (error) {
    toastApiError(error, 'No se pudo generar el código de ubicación')
  } finally {
    isGeneratingUbicacion.value = false
  }
}

const uploadPendingImages = async (idProducto: number) => {
  const files = [...pendingImages.value]
  if (!files.length) return

  try {
    for (let index = 0; index < files.length; index += 1) {
      await productoImagenesService.crear(idProducto, files[index], {
        esPrincipal: index === 0,
      })
    }
    await queryClient.invalidateQueries({
      queryKey: productoImagenesQueryKeys.list(idProducto),
    })
    await queryClient.invalidateQueries({ queryKey: productosQueryKeys.lists() })
    toastSuccess(
      files.length === 1
        ? 'Imagen del producto subida'
        : `${files.length} imágenes del producto subidas`,
    )
  } catch (error) {
    toastApiError(error, 'El producto se creó, pero hubo un error al subir imágenes')
  } finally {
    pendingImages.value = []
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    if (esProductoDeSistema.value) {
      toastWarning('Los productos de sistema no se pueden modificar')
      return
    }

    const codigoNuevo = formValues.codigo.trim().toUpperCase()
    if (codigoProductoSistema(codigoNuevo) && !esProductoDeSistema.value) {
      toastWarning(
        `El código ${codigoNuevo} está reservado para un producto de sistema`,
      )
      return
    }

    const esServicioValue = tipoItem.value === 'servicio'
    const payload = {
      codigo: formValues.codigo,
      nombre: formValues.nombre,
      idSubCategoria: formValues.idSubCategoria
        ? Number(formValues.idSubCategoria)
        : undefined,
      codigoBarra: formValues.codigoBarra || undefined,
      codigoUbicacion: esServicioValue ? '' : formValues.codigoUbicacion || '',
      idUnidadMedida: formValues.idUnidadMedida
        ? Number(formValues.idUnidadMedida)
        : undefined,
      marca: formValues.marca || undefined,
      presentacion: formValues.presentacion || undefined,
      esGas: esServicioValue ? false : Boolean(formValues.esGas),
      esServicio: esServicioValue,
      esAlquilable: Boolean(formValues.esAlquilable),
      esMantenimiento:
        esServicioValue && !formValues.esAlquilable
          ? Boolean(formValues.esMantenimiento)
          : false,
      afectaStock:
        esServicioValue || Boolean(formValues.esGas)
          ? false
          : Boolean(formValues.afectaStock),
      precio: roundMoney(parseMoneyInput(formValues.precio) ?? 0),
      precioCompra: esServicioValue
        ? 0
        : roundMoney(parseMoneyInput(formValues.precioCompra) ?? 0),
      precioGarantia:
        formValues.esAlquilable || (!esServicioValue && formValues.esGas)
          ? roundMoney(parseMoneyInput(formValues.precioGarantia) ?? 0)
          : 0,
      factorKgM3:
        !esServicioValue && formValues.esGas && formValues.factorKgM3 != null
          ? Number(formValues.factorKgM3)
          : undefined,
      factorLbM3:
        !esServicioValue && formValues.esGas && formValues.factorLbM3 != null
          ? Number(formValues.factorLbM3)
          : undefined,
    }

    let productoGuardado: Producto

    if (isEdit.value && props.productoId) {
      productoGuardado = await updateMutation.mutateAsync({
        id: props.productoId,
        payload,
      })
      await queryClient.invalidateQueries({
        queryKey: productosQueryKeys.detail(props.productoId),
      })
    } else {
      productoGuardado = await createMutation.mutateAsync(payload)
      if (productoGuardado?.id) {
        await uploadPendingImages(productoGuardado.id)
      }
    }

    emit('saved', productoGuardado)
  } catch {
    // toast en mutation
  }
})

onMounted(async () => {
  await loadCatalogos()
})

watch(
  () => props.active,
  async (isActive) => {
    if (isActive && props.mode === 'create') {
      resetForm()
      pendingImages.value = []
      setTipoItem('producto', { regenerarCodigo: false })
      formHydrated.value = true
      await generarCodigoProducto(false)
    }
  },
  { immediate: true },
)

watch(
  () => producto.value,
  (data) => {
    if (props.active && isEdit.value && data) {
      syncFormFromProducto()
    }
  },
  { immediate: true },
)

watch(esGas, (esGasValue) => {
  if (esGasValue) setFieldValue('afectaStock', false)
  if (!isEdit.value && esCodigoAutoGenerado(codigo.value)) {
    void generarCodigoProducto(false)
  }
  if (!esGasValue && !esAlquilable.value) {
    setFieldValue('precioGarantia', '')
  }
})

watch(esAlquilable, (alquilable) => {
  if (alquilable) setFieldValue('esMantenimiento', false)
  if (!alquilable && !esGas.value) {
    setFieldValue('precioGarantia', '')
  }
})

watch(idCategoria, (categoriaId, previousCategoriaId) => {
  if (!formHydrated.value || categoriaId === previousCategoriaId) return

  const subCategoriaId = Number(idSubCategoria.value)
  if (!subCategoriaId) return

  const belongsToCategoria = subCategorias.value.some(
    (subCategoria) =>
      subCategoria.id === subCategoriaId &&
      subCategoria.id_categoria === Number(categoriaId),
  )

  if (!belongsToCategoria) {
    idSubCategoria.value = undefined
  }
})
</script>
