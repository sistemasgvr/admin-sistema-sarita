<template>
  <div
    v-if="showPagination"
    class="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <p v-if="showSummary" class="text-sm text-gray-500 dark:text-gray-400">
        Mostrando
        <span class="font-medium text-gray-800 dark:text-white/90">{{ summary.from }}</span>
        -
        <span class="font-medium text-gray-800 dark:text-white/90">{{ summary.to }}</span>
        de
        <span class="font-medium text-gray-800 dark:text-white/90">{{ summary.total }}</span>
      </p>

      <div v-if="showPageSize" class="flex items-center gap-2">
        <label :for="pageSizeId" class="text-sm text-gray-500 dark:text-gray-400">
          Por página
        </label>
        <select
          :id="pageSizeId"
          v-model.number="limiteModel"
          class="form-control h-9 w-[88px] appearance-none bg-none px-3 py-1.5 text-sm"
          :disabled="disabled"
        >
          <option
            v-for="option in pageSizeOptions"
            :key="option"
            :value="option"
            class="text-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {{ option }}
          </option>
        </select>
      </div>
    </div>

    <nav class="flex items-center justify-center gap-2 sm:justify-end" aria-label="Paginación">
      <button
        type="button"
        class="flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        :disabled="disabled || paginaModel <= 1"
        aria-label="Página anterior"
        @click="goToPage(paginaModel - 1)"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="18" />
      </button>

      <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
        <span
          v-if="item === 'ellipsis'"
          class="flex h-9 min-w-9 items-center justify-center px-1 text-sm text-gray-400"
        >
          ...
        </span>

        <button
          v-else
          type="button"
          class="flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          :class="
            item === paginaModel
              ? 'border-brand-500 bg-brand-500 text-white hover:bg-brand-600 dark:border-brand-500 dark:bg-brand-500'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]'
          "
          :disabled="disabled"
          :aria-current="item === paginaModel ? 'page' : undefined"
          @click="goToPage(item)"
        >
          {{ item }}
        </button>
      </template>

      <button
        type="button"
        class="flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        :disabled="disabled || paginaModel >= totalPages"
        aria-label="Página siguiente"
        @click="goToPage(paginaModel + 1)"
      >
        <AppIcon :name="ICONS.chevronRight" :size="18" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, useId, watch } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { PaginationMeta } from '@/shared/interfaces/pagination.interface'
import {
  createPaginationRange,
  getPaginationSummary,
  getTotalPages,
} from '@/shared/utils/pagination'

interface AppPaginationProps {
  total?: number
  meta?: PaginationMeta | null
  showSummary?: boolean
  showPageSize?: boolean
  pageSizeOptions?: number[]
  siblingCount?: number
  disabled?: boolean
  hideOnSinglePage?: boolean
}

const props = withDefaults(defineProps<AppPaginationProps>(), {
  showSummary: true,
  showPageSize: true,
  pageSizeOptions: () => [10, 20, 50, 100],
  siblingCount: 1,
  disabled: false,
  hideOnSinglePage: false,
})

const paginaModel = defineModel<number>('pagina', { default: 1 })
const limiteModel = defineModel<number>('limite', { default: 10 })

const pageSizeId = useId()

const currentTotal = computed(() => props.meta?.total ?? props.total ?? 0)
const currentLimite = computed(() => props.meta?.limite ?? limiteModel.value)
const currentPagina = computed(() => props.meta?.pagina ?? paginaModel.value)

const totalPages = computed(() => getTotalPages(currentTotal.value, currentLimite.value))

const summary = computed(() =>
  getPaginationSummary(currentPagina.value, currentLimite.value, currentTotal.value),
)

const pageItems = computed(() =>
  createPaginationRange(currentPagina.value, totalPages.value, props.siblingCount),
)

const showPagination = computed(() => {
  if (currentTotal.value <= 0) return props.showSummary || props.showPageSize
  if (props.hideOnSinglePage && totalPages.value <= 1) {
    return props.showSummary || props.showPageSize
  }
  return true
})

const goToPage = (page: number) => {
  if (props.disabled || page < 1 || page > totalPages.value || page === paginaModel.value) {
    return
  }

  paginaModel.value = page
}

watch(limiteModel, (newLimit, oldLimit) => {
  if (newLimit === oldLimit) return
  paginaModel.value = 1
})

watch(currentTotal, (total) => {
  if (total <= 0) {
    paginaModel.value = 1
    return
  }

  if (paginaModel.value > getTotalPages(total, limiteModel.value)) {
    paginaModel.value = Math.max(getTotalPages(total, limiteModel.value), 1)
  }
})
</script>
