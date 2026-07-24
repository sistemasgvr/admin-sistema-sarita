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
  saved: [producto: Producto]
}>()

const productoId = computed(() => props.producto?.id)

const handleClose = () => {
  open.value = false
}

const onSaved = (producto: Producto) => {
  emit('saved', producto)
  open.value = false
}
</script>
