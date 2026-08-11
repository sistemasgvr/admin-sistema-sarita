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
        title="Tipo de ítem"
        :icon="ICONS.layers"
        help="Producto: accesorio con stock, o gas solo con precio (cantidad en Balones / Stock de gas). Servicio: flete, mantenimiento o alquiler de regulador."
      >
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-xl border px-4 py-4 text-left transition"
            :class="tipoItemCardClass('producto')"
            :disabled="isSubmitting"
            @click="setTipoItem('producto')"
          >
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Producto</p>
            <p class="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Accesorio, gas, envase o descartable. Puede afectar stock y usarse en ventas /
              recargas / garantías.
            </p>
          </button>

          <button
            type="button"
            class="rounded-xl border px-4 py-4 text-left transition"
            :class="tipoItemCardClass('servicio')"
            :disabled="isSubmitting"
            @click="setTipoItem('servicio')"
          >
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Servicio</p>
            <p class="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              No maneja stock (flete, mantenimiento). Marca “Alquilable” solo si es un
              regulador u otro servicio de alquiler.
            </p>
          </button>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Identificación" :icon="ICONS.package">
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput
              v-model="codigo"
              label="Código"
              placeholder="GAS-OX-001"
              required
              v-bind="codigoAttrs"
              :disabled="isSubmitting"
              :error="errors.codigo"
            />

            <AppInput
              v-model="codigoBarra"
              label="Código de barras"
              placeholder="Opcional"
              v-bind="codigoBarraAttrs"
              :disabled="isSubmitting"
            />
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

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput
              v-model="marca"
              label="Marca"
              placeholder="Opcional"
              v-bind="marcaAttrs"
              :disabled="isSubmitting"
            />

            <AppInput
              v-model="presentacion"
              label="Presentación"
              placeholder="Ej. Cilindro 10 m³"
              v-bind="presentacionAttrs"
              :disabled="isSubmitting"
            />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <AppInput
              v-model="codigoUbicacion"
              label="Código de ubicación"
              placeholder="Ej. ARO-GEN-01"
              v-bind="codigoUbicacionAttrs"
              :disabled="isSubmitting || isGeneratingUbicacion || tipoItem === 'servicio'"
            />
            <button
              type="button"
              class="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              :disabled="isSubmitting || isGeneratingUbicacion || tipoItem === 'servicio'"
              @click="generarCodigoUbicacion"
            >
              {{ isGeneratingUbicacion ? 'Generando...' : 'Generar' }}
            </button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{
              tipoItem === 'servicio'
                ? 'Los servicios no usan código de ubicación en almacén.'
                : 'Genera iniciales del nombre y marca (ej. ARO-GEN-01). En edición se guarda de inmediato.'
            }}
          </p>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Clasificación" :icon="ICONS.tags">
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppSelectWithCreate
              :can-create="canCreateCategoria"
              create-title="Nueva categoría"
              :disabled="isSubmitting"
              @create="categoriaModalOpen = true"
            >
              <AppSelect
                v-model="idCategoria"
                label="Categoría"
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
                placeholder="Selecciona subcategoría"
                v-bind="idSubCategoriaAttrs"
                :disabled="isSubmitting || !idCategoria"
                :options="subCategoriaOptions"
              />
            </AppSelectWithCreate>
          </div>

          <AppSelect
            v-model="idUnidadMedida"
            label="Unidad de medida"
            placeholder="Selecciona unidad"
            v-bind="idUnidadMedidaAttrs"
            :disabled="isSubmitting || unidadesMedidaQuery.isFetching.value"
            :options="unidadMedidaOptions"
          />
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Comercial" :icon="ICONS.creditCard">
        <div class="space-y-4">
          <div
            class="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Características
            </p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AppCheckbox
                v-if="tipoItem === 'producto'"
                v-model="esGas"
                :disabled="isSubmitting"
                label="Es gas (recarga / contenido)"
              />
              <AppCheckbox
                v-model="esAlquilable"
                :disabled="isSubmitting"
                :label="
                  tipoItem === 'servicio'
                    ? 'Es alquilable (ej. regulador medicinal)'
                    : 'Es alquilable'
                "
              />
              <AppCheckbox
                v-if="tipoItem === 'producto' && !esGas"
                v-model="afectaStock"
                :disabled="isSubmitting"
                label="Afecta stock"
              />
              <p
                v-else-if="tipoItem === 'producto' && esGas"
                class="text-xs text-gray-500 dark:text-gray-400 sm:col-span-2"
              >
                Los gases no usan Productos / Stock accesorios; la cantidad sale de los cilindros.
              </p>
            </div>
            <div
              v-if="tipoItem === 'producto' && esGas"
              class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <AppInput
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
            </div>
            <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {{ ayudaCaracteristicas }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput
              v-model="precio"
              label="Precio de venta"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              v-bind="precioAttrs"
              :disabled="isSubmitting"
              :error="errors.precio"
            />

            <AppInput
              v-model="precioCompra"
              label="Precio de compra"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              v-bind="precioCompraAttrs"
              :disabled="isSubmitting || tipoItem === 'servicio'"
              :error="errors.precioCompra"
            />
          </div>

          <AppInput
            v-if="esAlquilable || tipoItem === 'producto'"
            v-model="precioGarantia"
            label="Precio de garantía / depósito"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            v-bind="precioGarantiaAttrs"
            :disabled="isSubmitting"
            :error="errors.precioGarantia"
            help="Depósito reembolsable al prestar cilindro (industrial) o alquilar. Prefill en POS; se puede dejar en 0."
          />
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Imágenes" :icon="ICONS.images">
        <ProductoImagenesManager
          v-if="isEdit && producto?.id"
          :id-producto="producto.id"
          editable
        />

        <div v-else class="space-y-3">
          <AppDropzone
            v-model="pendingImages"
            label="Imágenes iniciales"
            title="Arrastra y suelta tus imágenes"
            description="PNG, JPG, WEBP o GIF. Arrástralas aquí o selecciónalas desde tu equipo."
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif"
            multiple
            :max-files="20"
            :max-filesize="10"
            :disabled="isSubmitting"
          />
        </div>
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useProductoDetailQuery } from '@/modules/productos/articulos/composables/useProductoDetailQuery'
import {
  useCreateProductoMutation,
  useUpdateProductoMutation,
} from '@/modules/productos/articulos/composables/useProductoMutations'
import ProductoImagenesManager from '@/modules/productos/articulos/components/ProductoImagenesManager.vue'
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
  AppInput,
  AppSelect,
  AppSelectWithCreate,
} from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

type TipoItem = 'producto' | 'servicio'

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
const formHydrated = ref(false)
const categoriaModalOpen = ref(false)
const subCategoriaModalOpen = ref(false)

const canCreateCategoria = computed(() =>
  authStore.hasPermission(PermisoBanderas.CATEGORIAS_CREAR),
)
const canCreateSubCategoria = computed(() =>
  authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_CREAR),
)

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
    return esAlquilable.value
      ? 'Servicio alquilable: aparecerá en POS Medicinal (regulador) y en el formulario de alquileres.'
      : 'Servicio no alquilable: útil para flete o mantenimiento. No aparece en selectores de alquiler.'
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
        afectaStock: yup.boolean().default(true),
        precio: optionalNumber().min(0, 'El precio de venta no puede ser negativo'),
        precioCompra: optionalNumber().min(0, 'El precio de compra no puede ser negativo'),
        precioGarantia: optionalNumber().min(0, 'La garantía no puede ser negativa'),
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
      afectaStock: true,
      precio: undefined as number | undefined,
      precioCompra: undefined as number | undefined,
      precioGarantia: undefined as number | undefined,
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
const [afectaStock] = defineField('afectaStock')
const [precio, precioAttrs] = defineField('precio')
const [precioCompra, precioCompraAttrs] = defineField('precioCompra')
const [precioGarantia, precioGarantiaAttrs] = defineField('precioGarantia')
const [factorKgM3] = defineField('factorKgM3')
const [factorLbM3] = defineField('factorLbM3')

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

function setTipoItem(tipo: TipoItem) {
  tipoItem.value = tipo
  if (tipo === 'servicio') {
    setFieldValue('esServicio', true)
    setFieldValue('esGas', false)
    setFieldValue('afectaStock', false)
    setFieldValue('precioCompra', undefined)
  } else {
    setFieldValue('esServicio', false)
    setFieldValue('afectaStock', true)
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
      afectaStock:
        data.es_servicio || data.es_gas ? false : (data.afecta_stock ?? true),
      precio: data.precio ?? undefined,
      precioCompra: data.precio_compra ?? undefined,
      precioGarantia: data.precio_garantia ?? undefined,
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
      afectaStock:
        esServicioValue || Boolean(formValues.esGas)
          ? false
          : Boolean(formValues.afectaStock),
      precio: formValues.precio ?? 0,
      precioCompra: esServicioValue ? 0 : (formValues.precioCompra ?? 0),
      precioGarantia: formValues.precioGarantia ?? 0,
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
  (isActive) => {
    if (isActive && props.mode === 'create') {
      setTipoItem('producto')
      resetForm()
      pendingImages.value = []
      formHydrated.value = true
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
