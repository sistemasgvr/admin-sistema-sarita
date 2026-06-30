<template>
  <div
    class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <div v-if="$slots.toolbar" class="border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-800">
      <slot name="toolbar" />
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              class="px-5 py-3 sm:px-6"
              :class="[
                getTableAlignClass(column.align),
                column.headerClass,
              ]"
            >
              <slot :name="`header-${column.key}`" :column="column">
                <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                  {{ column.label }}
                </p>
              </slot>
            </th>

            <th
              v-if="showActions"
              class="px-5 py-3 text-right sm:px-6"
              :class="actionsHeaderClass"
            >
              <slot name="header-actions">
                <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                  {{ actionsLabel }}
                </p>
              </slot>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading">
            <td :colspan="totalColumns" class="px-5 py-10 text-center sm:px-6">
              <slot name="loading">
                <p class="text-sm text-gray-500 dark:text-gray-400">Cargando registros...</p>
              </slot>
            </td>
          </tr>

          <tr v-else-if="!rows.length">
            <td :colspan="totalColumns" class="px-5 py-10 text-center sm:px-6">
              <slot name="empty">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ emptyText }}</p>
              </slot>
            </td>
          </tr>

          <tr
            v-else
            v-for="(row, index) in rows"
            :key="resolveTableRowKey(row, index, rowKey)"
            class="border-t border-gray-100 dark:border-gray-800"
          >
            <td
              v-for="column in visibleColumns"
              :key="column.key"
              class="px-5 py-4 sm:px-6"
              :class="[
                getTableAlignClass(column.align),
                column.cellClass,
              ]"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getTableCellValue(row, column.key)"
                :index="index"
                :column="column"
              >
                <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                  {{ formatTableCellValue(row, column) }}
                </p>
              </slot>
            </td>

            <td v-if="showActions" class="px-5 py-4 text-right sm:px-6">
              <div class="flex items-center justify-end gap-2">
                <slot name="actions" :row="row" :index="index" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <slot name="footer" />
  </div>
</template>

<script setup lang="ts" generic="T extends object">
import { computed } from 'vue'
import type { TableColumn, TableRowKey } from '@/shared/interfaces/table.interface'
import {
  formatTableCellValue,
  getTableAlignClass,
  getTableCellValue,
  resolveTableRowKey,
} from '@/shared/utils/table'

interface AppTableProps {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey?: TableRowKey<T>
  loading?: boolean
  emptyText?: string
  showActions?: boolean
  actionsLabel?: string
  actionsHeaderClass?: string
}

const props = withDefaults(defineProps<AppTableProps>(), {
  loading: false,
  emptyText: 'No hay registros para mostrar.',
  showActions: true,
  actionsLabel: 'Acciones',
  actionsHeaderClass: '',
})

const visibleColumns = computed(() => props.columns.filter((column) => !column.hidden))

const totalColumns = computed(
  () => visibleColumns.value.length + (props.showActions ? 1 : 0),
)
</script>
