<template>
  <AppModal
    v-model="open"
    size="xl"
    :title="title"
    :subtitle="`${rows.length} registro(s)`"
    content-class="!px-0 !py-0"
  >
    <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
      <div class="w-full sm:max-w-sm">
        <AppInput v-model="buscar" type="search" placeholder="Buscar..." />
      </div>
    </div>

    <div class="p-4 sm:p-5">
      <AppTable
        :columns="columns"
        :rows="filtrados"
        :row-key="rowKey"
        :show-actions="false"
        empty-text="Sin registros para mostrar."
      />
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AppInput, AppModal, AppTable } from '@/shared/components'
import type { TableColumn, TableRowKey } from '@/shared/interfaces/table.interface'

const props = withDefaults(
  defineProps<{
    title: string
    columns: TableColumn<Record<string, unknown>>[]
    rows: Record<string, unknown>[]
    rowKey?: TableRowKey<Record<string, unknown>>
  }>(),
  {
    rowKey: 'idBalon' as unknown as TableRowKey<Record<string, unknown>>,
  },
)

const open = defineModel<boolean>({ required: true })

const buscar = ref('')

const filtrados = computed(() => {
  const q = buscar.value.trim().toLowerCase()
  if (!q) return props.rows
  return props.rows.filter((row) => JSON.stringify(Object.values(row)).toLowerCase().includes(q))
})

watch(open, (isOpen) => {
  if (isOpen) buscar.value = ''
})
</script>
