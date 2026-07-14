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
          <div class="flex shrink-0 items-center gap-1">
            <button
              v-if="clearable && hasValue && !disabled"
              type="button"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
              title="Limpiar"
              @click.stop="clearSelection"
            >
              <AppIcon :name="ICONS.x" :size="14" />
            </button>
            <AppIcon
              :name="ICONS.chevronDown"
              :size="20"
              :class="[
                'shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400',
                { 'rotate-180': isOpen },
              ]"
            />
          </div>
        </button>

        <Teleport to="body">
          <div
            v-if="isOpen"
            ref="dropdownRef"
            role="listbox"
            :style="dropdownStyle"
            class="app-select-search-dropdown fixed z-[100001] flex max-h-72 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
          >
            <div class="border-b border-gray-200 p-2 dark:border-gray-700">
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="search"
                :placeholder="searchPlaceholder"
                class="form-control w-full"
                @keydown.stop
              />
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto py-1">
              <div
                v-if="loading"
                class="flex items-center justify-center gap-2 px-4 py-6 text-sm text-gray-500 dark:text-gray-400"
              >
                <AppIcon :name="ICONS.loader" :size="16" class="animate-spin" />
                Buscando...
              </div>

              <p
                v-else-if="visibleOptions.length === 0"
                class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                {{ emptyText }}
              </p>

              <button
                v-for="option in visibleOptions"
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

interface AppSelectSearchProps {
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  clearable?: boolean
  loading?: boolean
  remote?: boolean
  options: SelectOption[]
  state?: FormControlState
}

const props = withDefaults(defineProps<AppSelectSearchProps>(), {
  placeholder: 'Seleccionar',
  searchPlaceholder: 'Buscar...',
  emptyText: 'Sin resultados',
  state: 'default',
  clearable: true,
  loading: false,
  remote: false,
})

const model = defineModel<string | number | null>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const attrs = useAttrs()
const rootRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
const isOpen = ref(false)
const cachedSelectedLabel = ref('')
const dropdownStyle = ref<{ top: string; left: string; width: string }>({
  top: '0px',
  left: '0px',
  width: '0px',
})

const searchQuery = ref('')

const controlState = computed<FormControlState>(() =>
  props.error ? 'error' : props.state,
)

const selectClasses = useFormControlClasses(controlState, () => ({
  hasTrailingIcon: false,
}))

const hasValue = computed(() => model.value !== '' && model.value !== null)

const displayLabel = computed(() => {
  if (!hasValue.value) {
    return props.placeholder
  }

  const selected = props.options.find(
    (option) => String(option.value) === String(model.value),
  )

  return selected?.label ?? cachedSelectedLabel.value ?? props.placeholder
})

const normalizedSearch = computed(() => searchQuery.value.trim().toLowerCase())

const visibleOptions = computed(() => {
  if (props.remote) {
    return props.options
  }

  if (!normalizedSearch.value) {
    return props.options
  }

  return props.options.filter((option) =>
    option.label.toLowerCase().includes(normalizedSearch.value),
  )
})

const buttonAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const isOptionSelected = (option: SelectOption) =>
  String(option.value) === String(model.value)

const syncCachedLabelFromOptions = () => {
  if (!hasValue.value) {
    cachedSelectedLabel.value = ''
    return
  }

  const selected = props.options.find(
    (option) => String(option.value) === String(model.value),
  )

  if (selected) {
    cachedSelectedLabel.value = selected.label
  }
}

const updateDropdownPosition = () => {
  const trigger = rootRef.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const viewportPadding = 8
  const gap = 4
  const maxDropdownHeight = 288
  // Preferir abajo; solo voltear si abajo casi no cabe una lista usable
  const minSpaceToPreferDown = 160
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
  searchQuery.value = ''
  search.value = ''

  const onBlur = attrs.onBlur
  if (typeof onBlur === 'function') {
    onBlur(new FocusEvent('blur'))
  }
}

const openDropdown = async () => {
  if (props.disabled) return
  isOpen.value = true
  searchQuery.value = search.value
  await nextTick()
  updateDropdownPosition()
  searchInputRef.value?.focus()
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
  cachedSelectedLabel.value = option.label
  closeDropdown()
}

const clearSelection = () => {
  model.value = ''
  cachedSelectedLabel.value = ''
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

watch(searchQuery, (value) => {
  search.value = value
})

watch(search, (value) => {
  if (!isOpen.value) return
  if (value !== searchQuery.value) {
    searchQuery.value = value
  }
})

watch(
  () => props.options,
  () => {
    syncCachedLabelFromOptions()
  },
  { deep: true },
)

watch(model, () => {
  syncCachedLabelFromOptions()
})

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
