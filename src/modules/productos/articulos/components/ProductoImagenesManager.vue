<template>
  <div class="space-y-4">
    <div v-if="editable" class="space-y-3">
      <AppDropzone
        ref="dropzoneRef"
        v-model="selectedFiles"
        label="Agregar imágenes"
        title="Arrastra y suelta tus imágenes"
        description="PNG, JPG, WEBP o GIF. Arrástralas aquí o selecciónalas desde tu equipo."
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif"
        multiple
        :max-files="20"
        :max-filesize="10"
        :disabled="isBusy"
      />

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isBusy || !selectedFiles.length"
          @click="uploadSelected"
        >
          <AppIcon :name="ICONS.upload" :size="16" />
          {{ isUploading ? 'Subiendo...' : `Subir${selectedFiles.length ? ` (${selectedFiles.length})` : ''}` }}
        </button>
        <button
          v-if="selectedFiles.length"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          :disabled="isBusy"
          @click="clearSelection"
        >
          Limpiar
        </button>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando imágenes...
    </div>

    <div
      v-else-if="!imagenes.length"
      class="rounded-xl border border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"
    >
      Este producto aún no tiene imágenes.
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <article
        v-for="imagen in imagenes"
        :key="imagen.id"
        class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
      >
        <button
          type="button"
          class="relative aspect-square w-full bg-gray-100 dark:bg-gray-800"
          :disabled="!imagen.url_firmada"
          title="Vista previa"
          @click="openPreview(imagen)"
        >
          <img
            v-if="imagen.url_firmada"
            :src="imagen.url_firmada"
            :alt="imagen.nombre_original || 'Imagen del producto'"
            class="h-full w-full object-cover transition group-hover:opacity-95"
            loading="lazy"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-gray-400"
          >
            <AppIcon :name="ICONS.image" :size="28" />
          </div>
          <span
            v-if="imagen.url_firmada"
            class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100"
          >
            <span
              class="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm"
            >
              <AppIcon :name="ICONS.eye" :size="14" />
              Ver
            </span>
          </span>
        </button>

        <div class="space-y-2 p-3">
          <div class="flex items-start justify-between gap-2">
            <p
              class="truncate text-xs font-medium text-gray-700 dark:text-gray-200"
              :title="imagen.nombre_original || undefined"
            >
              {{ imagen.nombre_original || `Imagen #${imagen.id}` }}
            </p>
            <AppBadge
              v-if="imagen.es_principal"
              variant="light"
              color="primary"
            >
              Principal
            </AppBadge>
          </div>

          <p class="text-[11px] text-gray-400 dark:text-gray-500">
            {{ formatBytes(imagen.tamanio_bytes) }}
          </p>

          <div class="flex flex-wrap gap-1">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              :disabled="!imagen.url_firmada"
              title="Vista previa"
              @click="openPreview(imagen)"
            >
              <AppIcon :name="ICONS.eye" :size="14" />
              Ver
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              :disabled="!imagen.url_firmada || isDownloadingId === imagen.id"
              title="Descargar"
              @click="downloadImage(imagen)"
            >
              <AppIcon :name="ICONS.download" :size="14" />
              {{ isDownloadingId === imagen.id ? '...' : 'Descargar' }}
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              :disabled="!imagen.url_firmada"
              title="Abrir en nueva pestaña"
              @click="openInNewTab(imagen)"
            >
              <AppIcon :name="ICONS.externalLink" :size="14" />
              Abrir
            </button>

            <template v-if="editable">
              <button
                v-if="!imagen.es_principal"
                type="button"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                :disabled="isBusy"
                title="Marcar como principal"
                @click="setPrincipal(imagen)"
              >
                <AppIcon :name="ICONS.star" :size="14" />
                Principal
              </button>

              <label
                class="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                :class="{ 'pointer-events-none opacity-60': isBusy }"
                title="Reemplazar archivo"
              >
                <AppIcon :name="ICONS.replace" :size="14" />
                Cambiar
                <input
                  type="file"
                  class="hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif"
                  :disabled="isBusy"
                  @change="onReplaceFile($event, imagen)"
                />
              </label>

              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-error-500 hover:bg-error-500/10"
                :disabled="isBusy"
                title="Eliminar imagen"
                @click="askDelete(imagen)"
              >
                <AppIcon :name="ICONS.trash" :size="14" />
                Eliminar
              </button>
            </template>
          </div>
        </div>
      </article>
    </div>

    <AppModal
      v-model="previewOpen"
      :title="previewImage?.nombre_original || 'Vista previa'"
      size="xl"
    >
      <div
        class="flex min-h-[240px] items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800/60"
      >
        <img
          v-if="previewImage?.url_firmada"
          :src="previewImage.url_firmada"
          :alt="previewImage.nombre_original || 'Vista previa'"
          class="max-h-[70vh] w-auto max-w-full object-contain"
        />
      </div>

      <template #footer>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          :disabled="!previewImage?.url_firmada"
          @click="previewImage && downloadImage(previewImage)"
        >
          <AppIcon :name="ICONS.download" :size="16" />
          Descargar
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          :disabled="!previewImage?.url_firmada"
          @click="previewImage && openInNewTab(previewImage)"
        >
          <AppIcon :name="ICONS.externalLink" :size="16" />
          Nueva pestaña
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="previewOpen = false"
        >
          Cerrar
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar imagen"
      subtitle="También se borrará del almacenamiento."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-300">
        ¿Eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ imagenToDelete?.nombre_original || `imagen #${imagenToDelete?.id}` }}
        </span>
        del catálogo?
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
          :disabled="deleteMutation.isPending.value"
          @click="deleteModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-70 sm:w-auto"
          :disabled="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          {{ deleteMutation.isPending.value ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  useDeleteProductoImagenMutation,
  useReplaceProductoImagenMutation,
  useUpdateProductoImagenMutation,
} from '@/modules/productos/articulos/composables/useProductoImagenMutations'
import { useProductoImagenesQuery } from '@/modules/productos/articulos/composables/useProductoImagenesQuery'
import { productoImagenesQueryKeys } from '@/modules/productos/articulos/constants/productoImagenesQueryKeys'
import type { ProductoImagen } from '@/modules/productos/articulos/interfaces/producto-imagen.interface'
import { productoImagenesService } from '@/modules/productos/articulos/services/producto-imagenes.service'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppBadge, AppDropzone, AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

const props = withDefaults(
  defineProps<{
    idProducto: number
    editable?: boolean
  }>(),
  {
    editable: false,
  },
)

const dropzoneRef = ref<{ clear: () => void } | null>(null)
const selectedFiles = ref<File[]>([])
const deleteModalOpen = ref(false)
const previewOpen = ref(false)
const imagenToDelete = ref<ProductoImagen | null>(null)
const previewImage = ref<ProductoImagen | null>(null)
const isUploading = ref(false)
const isDownloadingId = ref<number | null>(null)

const queryClient = useQueryClient()
const imagenesQuery = useProductoImagenesQuery(computed(() => props.idProducto))
const updateMutation = useUpdateProductoImagenMutation()
const replaceMutation = useReplaceProductoImagenMutation()
const deleteMutation = useDeleteProductoImagenMutation()

const imagenes = computed(() => imagenesQuery.data.value?.data ?? [])
const isLoading = computed(() => imagenesQuery.isLoading.value)
const isBusy = computed(
  () =>
    isUploading.value ||
    updateMutation.isPending.value ||
    replaceMutation.isPending.value ||
    deleteMutation.isPending.value,
)

const formatBytes = (bytes?: number | null) => {
  if (bytes == null || Number.isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const clearSelection = () => {
  dropzoneRef.value?.clear()
  selectedFiles.value = []
}

const openPreview = (imagen: ProductoImagen) => {
  if (!imagen.url_firmada) return
  previewImage.value = imagen
  previewOpen.value = true
}

const openInNewTab = (imagen: ProductoImagen) => {
  if (!imagen.url_firmada) return
  window.open(imagen.url_firmada, '_blank', 'noopener,noreferrer')
}

const downloadImage = async (imagen: ProductoImagen) => {
  if (!imagen.url_firmada) return

  isDownloadingId.value = imagen.id
  const filename = imagen.nombre_original || `imagen-${imagen.id}`

  try {
    const response = await fetch(imagen.url_firmada)
    if (!response.ok) throw new Error('No se pudo descargar el archivo')

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    // Fallback si CORS bloquea el blob: abrir en nueva pestaña
    window.open(imagen.url_firmada, '_blank', 'noopener,noreferrer')
  } finally {
    isDownloadingId.value = null
  }
}

const uploadSelected = async () => {
  const files = [...selectedFiles.value]
  if (!files.length) return

  const hasPrincipal = imagenes.value.some((item) => item.es_principal)
  isUploading.value = true

  try {
    for (let index = 0; index < files.length; index += 1) {
      await productoImagenesService.crear(props.idProducto, files[index], {
        esPrincipal: !hasPrincipal && index === 0,
      })
    }
    await queryClient.invalidateQueries({
      queryKey: productoImagenesQueryKeys.list(props.idProducto),
    })
    toastSuccess(
      files.length === 1
        ? 'Imagen subida correctamente'
        : `${files.length} imágenes subidas correctamente`,
    )
    clearSelection()
  } catch (error) {
    toastApiError(error, 'No se pudo subir la imagen')
  } finally {
    isUploading.value = false
  }
}

const setPrincipal = async (imagen: ProductoImagen) => {
  try {
    await updateMutation.mutateAsync({
      id: imagen.id,
      idProducto: props.idProducto,
      payload: { esPrincipal: true },
    })
  } catch {
    // toast en mutation
  }
}

const onReplaceFile = async (event: Event, imagen: ProductoImagen) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  try {
    await replaceMutation.mutateAsync({
      id: imagen.id,
      idProducto: props.idProducto,
      file,
    })
  } catch {
    // toast en mutation
  }
}

const askDelete = (imagen: ProductoImagen) => {
  imagenToDelete.value = imagen
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!imagenToDelete.value) return

  try {
    await deleteMutation.mutateAsync({
      id: imagenToDelete.value.id,
      idProducto: props.idProducto,
    })
    deleteModalOpen.value = false
    imagenToDelete.value = null
  } catch (error) {
    toastApiError(error, 'No se pudo eliminar la imagen')
  }
}
</script>
