<template>
  <AppFormField
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :disabled="disabled"
    :id="id"
  >
    <template #default="{ id: fieldId }">
      <div ref="rootRef" class="relative">
        <button
          :id="fieldId"
          type="button"
          :name="name"
          :disabled="disabled"
          :aria-expanded="isOpen"
          aria-haspopup="listbox"
          :class="[
            selectClasses,
            'flex w-full items-center justify-between gap-2 text-left',
            { 'text-gray-800 dark:text-white': hasValue },
          ]"
          v-bind="buttonAttrs"
          @click="toggleOpen"
        >
          <span
            class="min-w-0 flex-1 truncate"
            :class="
              hasValue ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'
            "
          >
            {{ displayLabel }}
          </span>
          <AppIcon
            :name="ICONS.chevronDown"
            :size="20"
            :class="[
              'shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400',
              { 'rotate-180': isOpen },
            ]"
          />
        </button>

        <Teleport to="body">
          <div
            v-if="isOpen"
            ref="dropdownRef"
            role="listbox"
            :style="dropdownStyle"
            class="app-select-dropdown fixed z-[100001] max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              v-for="option in options"
              :key="String(option.value)"
              type="button"
              role="option"
              :aria-selected="isOptionSelected(option)"
              :disabled="option.disabled"
              :class="[
                'flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors',
                option.disabled
                  ? 'cursor-not-allowed text-gray-400 dark:text-gray-600'
                  : isOptionSelected(option)
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5',
              ]"
              @click="selectOption(option)"
            >
              {{ option.label }}
            </button>
          </div>
        </Teleport>
      </div>
    </template>
  </AppFormField>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useAttrs, watch } from 'vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useFormControlClasses } from '@/shared/composables/useFormControlClasses'
import { ICONS } from '@/shared/constants/icons'
import type { FormControlState, SelectOption } from '@/shared/interfaces/form.interface'

defineOptions({
  inheritAttrs: false,
})

interface AppSelectProps {
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  options: SelectOption[]
  state?: FormControlState
}

const props = withDefaults(defineProps<AppSelectProps>(), {
  state: 'default',
})

const model = defineModel<string | number | null>({ default: '' })

const attrs = useAttrs()
const rootRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const isOpen = ref(false)
const dropdownStyle = ref<{ top: string; left: string; width: string }>({
  top: '0px',
  left: '0px',
  width: '0px',
})

const controlState = computed<FormControlState>(() =>
  props.error ? 'error' : props.state,
)

const selectClasses = useFormControlClasses(controlState, () => ({
  hasTrailingIcon: false,
}))

const hasValue = computed(() => model.value !== '' && model.value !== null)

const displayLabel = computed(() => {
  if (!hasValue.value) {
    return props.placeholder ?? 'Seleccionar'
  }

  const selected = props.options.find(
    (option) => String(option.value) === String(model.value),
  )

  return selected?.label ?? props.placeholder ?? 'Seleccionar'
})

const buttonAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const isOptionSelected = (option: SelectOption) =>
  String(option.value) === String(model.value)

const updateDropdownPosition = () => {
  const trigger = rootRef.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const viewportPadding = 8
  const gap = 4
  const maxDropdownHeight = 240
  // Preferir abajo; solo voltear si abajo casi no cabe una lista usable
  const minSpaceToPreferDown = 128
  const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
  const spaceAbove = rect.top - viewportPadding
  const openUpward = spaceBelow < minSpaceToPreferDown && spaceAbove > spaceBelow

  let dropdownHeight = Math.min(
    maxDropdownHeight,
    Math.max(0, (openUpward ? spaceAbove : spaceBelow) - gap),
  )

  let top = openUpward ? rect.top - gap - dropdownHeight : rect.bottom + gap

  if (top < viewportPadding) {
    top = viewportPadding
    dropdownHeight = Math.min(dropdownHeight, Math.max(0, rect.top - gap - top))
  }

  const maxBottom = window.innerHeight - viewportPadding
  if (top + dropdownHeight > maxBottom) {
    dropdownHeight = Math.max(0, maxBottom - top)
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }

  if (dropdownRef.value) {
    dropdownRef.value.style.maxHeight = `${dropdownHeight}px`
  }
}

const closeDropdown = () => {
  if (!isOpen.value) return
  isOpen.value = false

  const onBlur = attrs.onBlur
  if (typeof onBlur === 'function') {
    onBlur(new FocusEvent('blur'))
  }
}

const openDropdown = async () => {
  if (props.disabled) return
  isOpen.value = true
  await nextTick()
  updateDropdownPosition()
}

const toggleOpen = () => {
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const selectOption = (option: SelectOption) => {
  if (option.disabled) return

  model.value = option.value
  closeDropdown()
}

const handleDocumentPointerDown = (event: MouseEvent) => {
  const target = event.target as Node
  if (rootRef.value?.contains(target) || dropdownRef.value?.contains(target)) return
  closeDropdown()
}

const handleDocumentKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeDropdown()
  }
}

const addGlobalListeners = () => {
  document.addEventListener('mousedown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeyDown)
  window.addEventListener('resize', updateDropdownPosition)
  window.addEventListener('scroll', updateDropdownPosition, true)
}

const removeGlobalListeners = () => {
  document.removeEventListener('mousedown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeyDown)
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
}

watch(isOpen, (open) => {
  if (open) {
    addGlobalListeners()
    return
  }
  removeGlobalListeners()
})

onUnmounted(() => {
  removeGlobalListeners()
})
</script>
