<template>
  <div ref="rootRef" class="relative">
    <label v-if="label" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>

    <div class="relative">
      <input
        ref="inputRef"
        type="text"
        class="h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 pr-9 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:bg-white/[0.03] dark:disabled:text-white/40"
        :class="
          error
            ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
            : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700'
        "
        :placeholder="displayPlaceholder"
        :disabled="disabled"
        :value="query"
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc="closeMenu"
      />

      <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="absolute inset-y-0 right-7 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        tabindex="-1"
        @click="clearSelection"
      >
        <AppIcon :name="ICONS.x" :size="14" />
      </button>

      <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
        <AppIcon :name="ICONS.search" :size="16" />
      </span>

      <div
        v-if="menuOpen"
        class="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
      >
        <div v-if="loading" class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          Buscando...
        </div>

        <template v-else>
          <button
            v-if="clearable"
            type="button"
            class="flex w-full items-center px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
            @mousedown.prevent="clearSelection"
          >
            {{ emptyOptionLabel }}
          </button>

          <button
            v-for="(option, index) in options"
            :key="String(option.value)"
            type="button"
            class="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
            :class="[
              index === highlightedIndex
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5',
              String(option.value) === String(modelValue) ? 'font-medium' : '',
            ]"
            @mousedown.prevent="selectOption(option)"
            @mouseenter="highlightedIndex = index"
          >
            {{ option.label }}
          </button>

          <div
            v-if="!options.length"
            class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
          >
            {{ query.length < minChars ? hintText : noResultsText }}
          </div>
        </template>
      </div>
    </div>

    <p v-if="error" class="mt-1.5 text-theme-xs text-error-500">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { SelectOption } from '@/shared/interfaces/form.interface'

interface SearchableSelectProps {
  modelValue: number | string | null | undefined
  modelLabel?: string | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  clearable?: boolean
  error?: string
  minChars?: number
  debounceMs?: number
  emptyOptionLabel?: string
  hintText?: string
  noResultsText?: string
  searchFn: (query: string) => Promise<SelectOption[]>
}

const props = withDefaults(defineProps<SearchableSelectProps>(), {
  modelLabel: null,
  label: undefined,
  placeholder: 'Busca...',
  required: false,
  disabled: false,
  clearable: true,
  error: undefined,
  minChars: 0,
  debounceMs: 350,
  emptyOptionLabel: 'Sin selección',
  hintText: 'Escribe para buscar...',
  noResultsText: 'Sin resultados',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
}>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const query = ref('')
const menuOpen = ref(false)
const loading = ref(false)
const options = ref<SelectOption[]>([])
const highlightedIndex = ref(-1)

const labelCache = new Map<string, string>()

const displayPlaceholder = computed(() => props.placeholder)

const setQueryFromSelection = () => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
    query.value = ''
    return
  }

  const cached = labelCache.get(String(props.modelValue))
  query.value = cached ?? props.modelLabel ?? ''
}

if (props.modelLabel && props.modelValue !== null && props.modelValue !== undefined) {
  labelCache.set(String(props.modelValue), props.modelLabel)
}
setQueryFromSelection()

let debounceTimer: ReturnType<typeof setTimeout> | undefined

const runSearch = async (term: string) => {
  if (term.length < props.minChars) {
    options.value = []
    return
  }

  loading.value = true
  try {
    const result = await props.searchFn(term)
    options.value = result
    result.forEach((option) => labelCache.set(String(option.value), option.label))
    highlightedIndex.value = result.length ? 0 : -1
  } catch {
    options.value = []
  } finally {
    loading.value = false
  }
}

const onInput = (event: Event) => {
  query.value = (event.target as HTMLInputElement).value
  menuOpen.value = true

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    runSearch(query.value.trim())
  }, props.debounceMs)
}

const onFocus = () => {
  menuOpen.value = true
  if (!options.value.length && !loading.value) {
    runSearch('')
  }
}

const closeMenu = () => {
  menuOpen.value = false
  setQueryFromSelection()
}

const selectOption = (option: SelectOption) => {
  labelCache.set(String(option.value), option.label)
  emit('update:modelValue', option.value)
  query.value = option.label
  menuOpen.value = false
}

const clearSelection = () => {
  emit('update:modelValue', null)
  query.value = ''
  menuOpen.value = false
}

const highlightNext = () => {
  if (!menuOpen.value) {
    menuOpen.value = true
    return
  }
  highlightedIndex.value = Math.min(highlightedIndex.value + 1, options.value.length - 1)
}

const highlightPrev = () => {
  highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
}

const selectHighlighted = () => {
  const option = options.value[highlightedIndex.value]
  if (option) selectOption(option)
}

const handleClickOutside = (event: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    closeMenu()
  }
}

watch(
  () => props.modelValue,
  async () => {
    setQueryFromSelection()
    await nextTick()
  },
)

watch(
  () => props.modelLabel,
  (newLabel) => {
    if (newLabel && props.modelValue !== null && props.modelValue !== undefined) {
      labelCache.set(String(props.modelValue), newLabel)
      if (!menuOpen.value) setQueryFromSelection()
    }
  },
)

document.addEventListener('mousedown', handleClickOutside)
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearTimeout(debounceTimer)
})
</script>