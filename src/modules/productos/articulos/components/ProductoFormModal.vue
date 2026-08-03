<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo producto' : 'Editar producto'"
    :subtitle="
      mode === 'create'
        ? 'Registra un producto o servicio en el catálogo.'
        : 'Actualiza los datos del producto seleccionado.'
    "
    size="xl"
    @close="handleClose"
  >
    <ProductoForm
      :mode="mode"
      :producto-id="productoId"
      :active="open"
      @saved="onSaved"
      @cancel="handleClose"
    />
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProductoForm from '@/modules/productos/articulos/components/ProductoForm.vue'
import type {
  Producto,
  ProductoFormMode,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import { AppModal } from '@/shared/components'

const props = defineProps<{
  mode: ProductoFormMode
  producto?: Producto | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [producto?: Producto]
}>()

const listaUnidadMedidaId = ref(ListaIds.UNIDAD_MEDIDA)
const unidadesMedidaQuery = useListaOpcionesQuery(listaUnidadMedidaId)

const queryClient = useQueryClient()
const createMutation = useCreateProductoMutation()
const updateMutation = useUpdateProductoMutation()
const pendingImages = ref<File[]>([])
const isGeneratingUbicacion = ref(false)

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
const [esServicio] = defineField('esServicio')
const [esAlquilable] = defineField('esAlquilable')
const [afectaStock] = defineField('afectaStock')
const [precio, precioAttrs] = defineField('precio')
const [precioCompra, precioCompraAttrs] = defineField('precioCompra')
const [precioGarantia, precioGarantiaAttrs] = defineField('precioGarantia')

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
      codigoUbicacion: props.producto?.codigo_ubicacion ?? '',
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
      precioCompra: props.producto?.precio_compra ?? undefined,
      precioGarantia: props.producto?.precio_garantia ?? undefined,
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSaved = (producto: Producto) => {
  emit('saved', producto)
  open.value = false
}
const generarCodigoUbicacion = async () => {
  const nombreActual = (nombre.value ?? '').trim()
  if (!nombreActual) {
    toastApiError(new Error('Ingresa el nombre del producto antes de generar'), 'Nombre requerido')
    return
  }

  isGeneratingUbicacion.value = true
  try {
    const persistir = props.mode === 'edit' && props.producto?.id != null
    const result = await productosService.generarCodigoUbicacion({
      nombre: nombreActual,
      marca: (marca.value ?? '').trim() || undefined,
      idProducto: persistir ? props.producto!.id : undefined,
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
    toastSuccess(
      files.length === 1
        ? 'Imagen del producto subida'
        : `${files.length} imágenes del producto subidas`,
    )
  } catch (error) {
    toastApiError(
      error,
      'El producto se creó, pero hubo un error al subir imágenes',
    )
  } finally {
    pendingImages.value = []
  }
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
      codigoUbicacion: formValues.codigoUbicacion || '',
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
      precioCompra: formValues.precioCompra ?? 0,
      precioGarantia: formValues.esAlquilable ? (formValues.precioGarantia ?? 0) : 0,
    }

    let createdProducto: Producto | undefined

    if (props.mode === 'create') {
      createdProducto = await createMutation.mutateAsync(payload)
      if (createdProducto?.id) {
        await uploadPendingImages(createdProducto.id)
      }
    } else if (props.producto) {
      await updateMutation.mutateAsync({
        id: props.producto.id,
        payload,
      })
    } else {
      return
    }

    emit('saved', createdProducto)
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
      pendingImages.value = []
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
