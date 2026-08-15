<template>
  <button
    type="button"
    class="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] lg:h-auto lg:w-auto lg:px-4 lg:py-2.5"
    :disabled="disabled || isExporting"
    :title="isExporting ? 'Exportando...' : label"
    :aria-label="isExporting ? 'Exportando...' : label"
    @click="handleClick"
  >
    <AppIcon
      v-if="isExporting"
      :name="ICONS.loader"
      :size="18"
      class="animate-spin"
    />
    <IconExcel v-else class="h-[18px] w-[18px] shrink-0" />
    <span class="hidden lg:inline">{{ isExporting ? 'Exportando...' : label }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import IconExcel from '@/shared/components/IconExcel.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastApiError } from '@/shared/composables/useToast'

interface AppExportExcelButtonProps {
  label?: string
  disabled?: boolean
  /** Lógica de exportación propia del módulo (arma filas/columnas y descarga el archivo). */
  onExport: () => Promise<void> | void
}

const props = withDefaults(defineProps<AppExportExcelButtonProps>(), {
  label: 'Exportar Excel',
  disabled: false,
})

const isExporting = ref(false)

const handleClick = async () => {
  if (isExporting.value) return
  isExporting.value = true
  try {
    await props.onExport()
  } catch (error) {
    toastApiError(error, 'No se pudo generar el Excel')
  } finally {
    isExporting.value = false
  }
}
</script>
