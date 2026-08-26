<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2.5">
      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
        <AppIcon :name="ICONS.image" :size="14" />
      </span>
      <div class="flex min-w-0 flex-1 items-center justify-between gap-2">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">Imagen del activo</p>
        <span class="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-theme-xs font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
          Opcional
        </span>
      </div>
    </div>

    <div
      v-if="previewUrl"
      class="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900/40"
    >
      <img :src="previewUrl" alt="Imagen del activo" class="h-52 w-full object-cover" />

      <div
        class="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-gray-900/70 via-gray-900/10 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        <AppDropzone
          v-if="!disabled"
          :multiple="false"
          accept="image/*"
          :disabled="isUploading"
          class="!border-0 !bg-transparent !p-0"
          @change="onFiles"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="isUploading"
          >
            <AppIcon
              :name="isUploading ? ICONS.loader : ICONS.upload"
              :size="14"
              :class="{ 'animate-spin': isUploading }"
            />
            {{ isUploading ? 'Subiendo...' : 'Cambiar' }}
          </button>
        </AppDropzone>

        <button
          v-if="!disabled"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-error-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur hover:bg-error-500 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="isUploading"
          @click="clearImage"
        >
          <AppIcon :name="ICONS.trash" :size="14" />
          Quitar
        </button>
      </div>
    </div>

    <AppDropzone
      v-else
      :multiple="false"
      accept="image/*"
      :disabled="isUploading || disabled"
      label="Seleccionar imagen"
      title="Arrastra y suelta la imagen del activo"
      description="PNG, JPG o WEBP. Se usará como referencia visual del bien."
      class="!rounded-xl"
      @change="onFiles"
    />

    <p v-if="isUploading" class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <AppIcon :name="ICONS.loader" :size="12" class="animate-spin" />
      Subiendo imagen...
    </p>

    <p v-if="error" class="flex items-center gap-1.5 text-xs text-error-500">
      <AppIcon :name="ICONS.alertCircle" :size="12" class="shrink-0" />
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDropzone from '@/shared/components/form/AppDropzone.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { storageService } from '@/shared/services/storage.service'

const props = defineProps<{
  modelValue?: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const previewUrl = ref<string | null>(null)
const isUploading = ref(false)
const error = ref<string | null>(null)

const buildPreview = async (ruta?: string | null) => {
  if (!ruta) {
    previewUrl.value = null
    return
  }
  try {
    const { signedUrl } = await storageService.firmarUrl(ruta)
    previewUrl.value = signedUrl
  } catch {
    previewUrl.value = null
  }
}

watch(
  () => props.modelValue,
  (ruta) => buildPreview(ruta ?? null),
  { immediate: true },
)

const onFiles = async (files: File[]) => {
  const file = files?.[0]
  if (!file) return

  error.value = null
  isUploading.value = true
  try {
    const path = `activos/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const response = await storageService.subirArchivo(file, path)
    const ruta = response.ruta ?? response.path ?? null
    if (!ruta) throw new Error('No se recibió la ruta del archivo')
    emit('update:modelValue', ruta)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo subir la imagen'
  } finally {
    isUploading.value = false
  }
}

const clearImage = () => emit('update:modelValue', undefined)
</script>