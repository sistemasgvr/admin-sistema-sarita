<template>
  <AppFormField
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :disabled="disabled"
    :id="id"
  >
    <div class="app-dropzone" :class="{ 'opacity-60 pointer-events-none': disabled }">
      <!-- div (no form) para poder usarlo dentro de formularios del sistema -->
      <div
        :id="dropzoneId"
        class="dropzone rounded-xl border border-dashed border-gray-300 bg-gray-50 p-7 hover:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 lg:p-10"
      >
        <div class="dz-message m-0!">
          <div class="mb-[22px] flex justify-center">
            <div
              class="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              <AppIcon :name="ICONS.upload" :size="28" />
            </div>
          </div>

          <h4 class="mb-3 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
            {{ title }}
          </h4>
          <span
            class="mx-auto mb-5 block w-full max-w-[320px] text-sm text-gray-700 dark:text-gray-400"
          >
            {{ description }}
          </span>
          <span class="cursor-pointer text-theme-sm font-medium text-brand-500 underline">
            Seleccionar archivos
          </span>
        </div>
      </div>
    </div>
  </AppFormField>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useId, watch } from 'vue'
import Dropzone from 'dropzone'
import type { DropzoneFile } from 'dropzone'
import 'dropzone/dist/dropzone.css'
import AppIcon from '@/shared/components/AppIcon.vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { ICONS } from '@/shared/constants/icons'

interface AppDropzoneProps {
  label?: string
  hint?: string
  error?: string
  id?: string
  accept?: string
  multiple?: boolean
  maxFiles?: number
  /** Tamaño máximo por archivo en MB */
  maxFilesize?: number
  disabled?: boolean
  required?: boolean
  title?: string
  description?: string
}

const props = withDefaults(defineProps<AppDropzoneProps>(), {
  accept: 'image/jpeg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif',
  multiple: true,
  maxFiles: 20,
  maxFilesize: 10,
  title: 'Arrastra y suelta tus archivos',
  description: 'PNG, JPG, WEBP o GIF. También puedes seleccionarlos desde tu equipo.',
})

const model = defineModel<File[]>({ default: () => [] })

const emit = defineEmits<{
  change: [files: File[]]
}>()

const dropzoneId = `app-dropzone-${useId().replace(/:/g, '')}`
let instance: Dropzone | null = null
let syncingFromDropzone = false

const toPlainFiles = (files: DropzoneFile[]): File[] =>
  files
    .filter(
      (file) =>
        file.status !== Dropzone.ERROR &&
        file.status !== Dropzone.CANCELED,
    )
    .map((file) => file as unknown as File)

const syncModel = () => {
  if (!instance) return
  syncingFromDropzone = true
  const files = toPlainFiles(instance.files)
  model.value = files
  emit('change', files)
  syncingFromDropzone = false
}

onMounted(() => {
  Dropzone.autoDiscover = false

  instance = new Dropzone(`#${dropzoneId}`, {
    url: '/__local__',
    method: 'post',
    autoProcessQueue: false,
    uploadMultiple: false,
    createImageThumbnails: true,
    thumbnailWidth: 120,
    thumbnailHeight: 120,
    addRemoveLinks: true,
    acceptedFiles: props.accept,
    maxFilesize: props.maxFilesize,
    maxFiles: props.multiple ? props.maxFiles : 1,
    clickable: true,
    dictDefaultMessage: '',
    dictRemoveFile: 'Quitar',
    dictCancelUpload: 'Cancelar',
    dictInvalidFileType: 'Tipo de archivo no permitido',
    dictFileTooBig:
      'El archivo es demasiado grande ({{filesize}}MB). Máximo: {{maxFilesize}}MB',
    dictMaxFilesExceeded: 'Alcanzaste el máximo de archivos permitidos',
    init() {
      this.on('addedfile', () => {
        if (!props.multiple && this.files.length > 1) {
          this.files.slice(0, -1).forEach((file) => this.removeFile(file))
        }
        syncModel()
      })
      this.on('removedfile', () => {
        syncModel()
      })
      this.on('error', (file, message) => {
        if (file && !(message instanceof ProgressEvent)) {
          // Deja el preview con el error de Dropzone
        }
        syncModel()
      })
    },
  })

  if (props.disabled) {
    instance.disable()
  }

  if (model.value?.length) {
    // Solo limpiamos; no rehidratamos File[] a Dropzone (no hay preview fiable)
  }
})

watch(
  () => props.disabled,
  (disabled) => {
    if (!instance) return
    if (disabled) instance.disable()
    else instance.enable()
  },
)

watch(
  model,
  (files) => {
    if (syncingFromDropzone || !instance) return
    if ((!files || files.length === 0) && instance.files.length > 0) {
      instance.removeAllFiles(true)
    }
  },
  { deep: true },
)

onBeforeUnmount(() => {
  instance?.destroy()
  instance = null
})

defineExpose({
  clear: () => {
    instance?.removeAllFiles(true)
    model.value = []
  },
})
</script>

<style scoped>
:deep(.dropzone) {
  border-style: dashed;
  transition: all 0.3s ease;
  min-height: 180px;
}

:deep(.dropzone:hover) {
  border-color: #465fff;
}

:deep(.dropzone .dz-message) {
  margin: 0;
}

:deep(.dropzone .dz-preview) {
  margin: 10px;
}

:deep(.dropzone .dz-preview .dz-image) {
  border-radius: 8px;
}

:deep(.dropzone .dz-preview .dz-details) {
  padding: 1em;
}

:deep(.dropzone .dz-preview .dz-progress) {
  height: 10px;
}

:deep(.dropzone .dz-preview .dz-progress .dz-upload) {
  background: #465fff;
}

:deep(.dropzone .dz-preview .dz-remove) {
  font-size: 12px;
  color: #f04438;
  margin-top: 4px;
}

:deep(.dark .dropzone) {
  background-color: #111827;
  border-color: #374151;
}

:deep(.dark .dropzone:hover) {
  border-color: #7592ff;
}
</style>
