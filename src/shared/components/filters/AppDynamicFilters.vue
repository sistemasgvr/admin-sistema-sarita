<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      :aria-expanded="isOpen"
      :class="[
        'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition',
        activeCount() > 0
          ? 'border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]',
      ]"
      @click="togglePanel"
    >
      <AppIcon :name="ICONS.listFilter" :size="18" />
      <span v-if="activeCount() > 0" class="tabular-nums">{{ activeCount() }}</span>
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelRef"
        :style="panelStyle"
        class="fixed z-[100000] w-[min(100vw-2rem,28rem)] rounded-xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="space-y-3">
          <div
            v-for="row in rows"
            :key="row.id"
            class="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto] items-start gap-2"
          >
            <div
              class="flex h-[46px] items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300"
            >
              <span class="truncate">{{ fieldDef(row.fieldKey)?.label ?? row.fieldKey }}</span>
            </div>

            <AppSelect
              v-if="fieldDef(row.fieldKey)?.type === 'select'"
              :model-value="asSelectValue(row.value)"
              :options="fieldDef(row.fieldKey)?.options ?? []"
              :placeholder="fieldDef(row.fieldKey)?.placeholder ?? 'Seleccionar'"
              :disabled="fieldDef(row.fieldKey)?.disabled"
              @update:model-value="(value) => updateRowValue(row, value)"
            />

            <AppInput
              v-else-if="fieldDef(row.fieldKey)?.type === 'text'"
              :model-value="asTextValue(row.value)"
              type="search"
              :placeholder="fieldDef(row.fieldKey)?.placeholder ?? 'Valor'"
              @update:model-value="(value) => updateRowValue(row, value)"
            />

            <AppInput
              v-else-if="fieldDef(row.fieldKey)?.type === 'date'"
              :model-value="asTextValue(row.value)"
              type="date"
              @update:model-value="(value) => updateRowValue(row, value)"
            />

            <div
              v-else-if="fieldDef(row.fieldKey)?.type === 'checkbox'"
              class="flex h-[46px] items-center rounded-lg border border-gray-200 px-3 dark:border-gray-700"
            >
              <AppCheckbox
                :model-value="row.value === true || row.value === 'true'"
                :label="fieldDef(row.fieldKey)?.placeholder ?? 'Sí'"
                @update:model-value="(checked) => onCheckboxChange(row, checked)"
              />
            </div>

            <button
              type="button"
              title="Limpiar filtro"
              class="mt-0.5 inline-flex h-[46px] w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/5 dark:hover:text-brand-400"
              :disabled="!isActiveValue(row.value)"
              @click="clearRowValue(row.id)"
            >
              <AppIcon :name="ICONS.brushCleaning" :size="16" />
            </button>
          </div>
        </div>

        <div class="mt-4 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-800">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40 dark:text-gray-400 dark:hover:text-brand-400"
            :disabled="activeCount() === 0"
            @click="clearAll"
          >
            <AppIcon :name="ICONS.brushCleaning" :size="16" />
            Limpiar todo
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, toRef, watch } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppCheckbox, AppInput, AppSelect } from '@/shared/components'
import { useDynamicFilters } from '@/shared/composables/useDynamicFilters'
import { ICONS } from '@/shared/constants/icons'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'

const props = withDefaults(
  defineProps<{
    fields: DynamicFilterFieldDef[]
    preloadAllFields?: boolean
  }>(),
  {
    preloadAllFields: true,
  },
)

const model = defineModel<DynamicFilterValues>({ default: () => ({}) })

const emit = defineEmits<{
  change: []
}>()

const rootRef = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()
const panelStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

const fieldsRef = toRef(() => props.fields)

const {
  rows,
  isOpen,
  fieldDef,
  clearRowValue,
  clearAll,
  onValueChange,
  openPanel,
  closePanel,
  activeCount,
} = useDynamicFilters(
  fieldsRef,
  model,
  () => emit('change'),
  props.preloadAllFields,
)

const isActiveValue = (value: unknown) =>
  value !== '' && value !== null && value !== undefined

const asSelectValue = (value: string | number | boolean | null) =>
  typeof value === 'boolean' ? '' : value

const asTextValue = (value: string | number | boolean | null) =>
  typeof value === 'boolean' ? '' : String(value ?? '')

const updateRowValue = (
  row: { value: string | number | boolean | null },
  value: string | number | null,
) => {
  row.value = value
  onValueChange()
}

const onCheckboxChange = (row: { value: string | number | boolean | null }, checked: boolean) => {
  row.value = checked ? true : ''
  onValueChange()
}

const updatePanelPosition = () => {
  const trigger = rootRef.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const panelWidth = Math.min(window.innerWidth - 32, 448)
  const left = Math.min(
    Math.max(16, rect.right - panelWidth),
    window.innerWidth - panelWidth - 16,
  )

  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${left}px`,
  }
}

const togglePanel = async () => {
  if (isOpen.value) {
    closePanel()
    return
  }

  openPanel()
  await nextTick()
  updatePanelPosition()
}

const handleDocumentPointerDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (rootRef.value?.contains(target) || panelRef.value?.contains(target)) return
  if (target.closest('.app-select-dropdown, [role="listbox"]')) return
  closePanel()
}

const handleDocumentKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closePanel()
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('mousedown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleDocumentKeyDown)
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)
    return
  }

  document.removeEventListener('mousedown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeyDown)
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeyDown)
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
})
</script>
