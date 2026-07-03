<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo producto' : 'Editar producto'"
    :subtitle="
      mode === 'create'
        ? 'Registra gases, accesorios o servicios del catálogo.'
        : 'Actualiza los datos del producto seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="producto-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
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
        <AppSelect
          v-model="idCategoria"
          label="Categoría"
          placeholder="Selecciona categoría"
          v-bind="idCategoriaAttrs"
          :disabled="isSubmitting"
          :options="categoriaOptions"
        />

        <AppSelect
          v-model="idSubCategoria"
          label="Subcategoría"
          placeholder="Selecciona subcategoría"
          v-bind="idSubCategoriaAttrs"
          :disabled="isSubmitting || !idCategoria"
          :options="subCategoriaOptions"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppSelect
          v-model="idUnidadMedida"
          label="Unidad de medida"
          placeholder="Selecciona unidad"
          v-bind="idUnidadMedidaAttrs"
          :disabled="isSubmitting || unidadesMedidaQuery.isFetching.value"
          :options="unidadMedidaOptions"
        />

        <AppInput
          v-model="precio"
          label="Precio base"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          v-bind="precioAttrs"
          :disabled="isSubmitting"
          :error="errors.precio"
        />
      </div>

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

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AppCheckbox v-model="esGas" :disabled="isSubmitting" label="Es gas" />
        <AppCheckbox v-model="esServicio" :disabled="isSubmitting" label="Es servicio" />
        <AppCheckbox v-model="esAlquilable" :disabled="isSubmitting" label="Es alquilable" />
        <AppCheckbox v-model="afectaStock" :disabled="isSubmitting" label="Afecta stock" />
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="producto-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear producto' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import {
  useCreateProductoMutation,
  useUpdateProductoMutation,
} from '@/modules/productos/articulos/composables/useProductoMutations'
import type {
  Producto,
  ProductoFormMode,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import type { SubCategoriaProducto } from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import { AppCheckbox, AppInput, AppModal, AppSelect } from '@/shared/components'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

interface ProductoFormModalProps {
  mode: ProductoFormMode
  producto?: Producto | null
  categorias: CategoriaProducto[]
  subCategorias: SubCategoriaProducto[]
}

const props = defineProps<ProductoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const listaUnidadMedidaId = ref(ListaIds.UNIDAD_MEDIDA)
const unidadesMedidaQuery = useListaOpcionesQuery(listaUnidadMedidaId)

const createMutation = useCreateProductoMutation()
const updateMutation = useUpdateProductoMutation()

const categoriaOptions = computed(() =>
  props.categorias.map((categoria) => ({
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

const { defineField, handleSubmit, resetForm, errors, isSubmitting, values } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      codigo: requiredString('El código'),
      codigoBarra: optionalString(),
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
      precio: optionalNumber().min(0, 'El precio no puede ser negativo'),
    }),
  ),
  initialValues: {
    codigo: '',
    codigoBarra: '',
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
  },
})

const [codigo, codigoAttrs] = defineField('codigo')
const [codigoBarra, codigoBarraAttrs] = defineField('codigoBarra')
const [nombre, nombreAttrs] = defineField('nombre')
const [idCategoria, idCategoriaAttrs] = defineField('idCategoria')
const [idSubCategoria, idSubCategoriaAttrs] = defineField('idSubCategoria')
const [idUnidadMedida, idUnidadMedidaAttrs] = defineField('idUnidadMedida')
const [marca, marcaAttrs] = defineField('marca')
const [presentacion, presentacionAttrs] = defineField('presentacion')
const [esGas] = defineField('esGas')
const [esServicio] = defineField('esServicio')
const [esAlquilable] = defineField('esAlquilable')
const [afectaStock] = defineField('afectaStock')
const [precio, precioAttrs] = defineField('precio')

const subCategoriaOptions = computed(() =>
  props.subCategorias
    .filter((subCategoria) =>
      values.idCategoria ? subCategoria.id_categoria === Number(values.idCategoria) : true,
    )
    .map((subCategoria) => ({
      value: subCategoria.id,
      label: subCategoria.nombre,
    })),
)

const syncFormValues = () => {
  resetForm({
    values: {
      codigo: props.producto?.codigo ?? '',
      codigoBarra: props.producto?.codigo_barra ?? '',
      nombre: props.producto?.nombre ?? '',
      idCategoria: props.producto?.id_categoria ?? undefined,
      idSubCategoria: props.producto?.id_sub_categoria ?? undefined,
      idUnidadMedida: props.producto?.id_unidad_medida ?? undefined,
      marca: props.producto?.marca ?? '',
      presentacion: props.producto?.presentacion ?? '',
      esGas: props.producto?.es_gas ?? false,
      esServicio: props.producto?.es_servicio ?? false,
      esAlquilable: props.producto?.es_alquilable ?? false,
      afectaStock: props.producto?.afecta_stock ?? true,
      precio: props.producto?.precio ?? undefined,
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const payload = {
      codigo: formValues.codigo,
      nombre: formValues.nombre,
      idSubCategoria: formValues.idSubCategoria
        ? Number(formValues.idSubCategoria)
        : undefined,
      codigoBarra: formValues.codigoBarra || undefined,
      idUnidadMedida: formValues.idUnidadMedida
        ? Number(formValues.idUnidadMedida)
        : undefined,
      marca: formValues.marca || undefined,
      presentacion: formValues.presentacion || undefined,
      esGas: formValues.esGas,
      esServicio: formValues.esServicio,
      esAlquilable: formValues.esAlquilable,
      afectaStock: formValues.afectaStock,
      precio: formValues.precio ?? 0,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.producto) {
      await updateMutation.mutateAsync({
        id: props.producto.id,
        payload,
      })
    } else {
      return
    }

    emit('saved')
    open.value = false
  } catch {
    // toast en mutation
  }
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      syncFormValues()
    }
  },
)

watch(
  () => props.producto,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(idCategoria, (categoriaId, previousCategoriaId) => {
  if (categoriaId === previousCategoriaId) return

  const subCategoriaId = Number(idSubCategoria.value)
  if (!subCategoriaId) return

  const belongsToCategoria = props.subCategorias.some(
    (subCategoria) =>
      subCategoria.id === subCategoriaId &&
      subCategoria.id_categoria === Number(categoriaId),
  )

  if (!belongsToCategoria) {
    idSubCategoria.value = undefined
  }
})
</script>
