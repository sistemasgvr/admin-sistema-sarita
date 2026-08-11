<template>
  <AppModal v-model="open" :title="title" size="md">
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Elige un rango de fechas o exporta todo.
      </p>

      <div>
        <div
          class="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
          role="tablist"
        >
          <button
            v-for="opt in modoOptions"
            :key="opt.value"
            type="button"
            role="tab"
            :aria-selected="modo === opt.value"
            :class="[
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
              modo === opt.value
                ? 'bg-white text-brand-600 shadow-theme-xs dark:bg-gray-900 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="modo = opt.value"
          >
            <AppIcon :name="opt.icon" :size="14" />
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div v-if="modo === 'rango'" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Desde" required :error="errores.desde">
          <AppInput v-model="rango.start" type="date" :state="errores.desde ? 'error' : 'default'" />
        </AppFormField>
        <AppFormField label="Hasta" required :error="errores.hasta">
          <AppInput v-model="rango.end" type="date" :state="errores.hasta ? 'error' : 'default'" />
        </AppFormField>
      </div>

      <p v-else class="text-theme-sm text-gray-500 dark:text-gray-400">
        Se exportarán <strong>todos</strong> los registros del listado (con los filtros de búsqueda ya aplicados).
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="exportando"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="exportando"
        @click="exportar"
      >
        <AppIcon :name="ICONS.download" :size="16" class="mr-1.5" />
        {{ exportando ? 'Generando...' : 'Exportar Excel' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { AppInput, AppModal } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

interface RangoExportar {
  desde?: string
  hasta?: string
}

const props = defineProps<{
  title?: string
  onExportar: (rango: RangoExportar) => Promise<void> | void
}>()

const open = defineModel<boolean>({ required: true })

type Modo = 'rango' | 'todo'
const modo = ref<Modo>('rango')

const modoOptions: { value: Modo; label: string; icon: string }[] = [
  { value: 'rango', label: 'Rango de fechas', icon: ICONS.calendar },
  { value: 'todo', label: 'Exportar todo', icon: ICONS.download },
]

const rango = reactive({ start: '', end: '' })
const errores = reactive<{ desde?: string; hasta?: string }>({})
const exportando = ref(false)

const validar = (): boolean => {
  errores.desde = undefined
  errores.hasta = undefined
  if (modo.value === 'todo') return true
  let ok = true
  if (!rango.start) { errores.desde = 'Obligatorio'; ok = false }
  if (!rango.end) { errores.hasta = 'Obligatorio'; ok = false }
  if (rango.start && rango.end && rango.end < rango.start) {
    errores.hasta = 'No puede ser anterior a "Desde"'
    ok = false
  }
  return ok
}

const exportar = async () => {
  if (!validar()) return
  exportando.value = true
  try {
    await props.onExportar(
      modo.value === 'todo' ? {} : { desde: rango.start, hasta: rango.end },
    )
    toastSuccess('Excel generado correctamente')
    open.value = false
  } catch (error) {
    toastApiError(error, 'No se pudo generar el archivo Excel')
  } finally {
    exportando.value = false
  }
}
</script>
