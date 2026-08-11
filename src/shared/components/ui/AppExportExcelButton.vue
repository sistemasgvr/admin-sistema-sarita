<template>
  <button
    type="button"
    class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
    :disabled="disabled || isExporting"
    @click="handleClick"
  >
    <AppIcon
      v-if="isExporting"
      :name="ICONS.loader"
      :size="18"
      class="animate-spin"
    />
    <IconExcel v-else class="h-[18px] w-[18px] shrink-0" />
    {{ isExporting ? 'Exportando...' : label }}
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
