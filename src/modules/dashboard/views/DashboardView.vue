<template>
  <div>
    <PageBreadcrumb page-title="Dashboard" />
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</p>
        <p class="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{{ card.value }}</p>
      </div>
    </div>
    <div
      class="mt-6 rounded-2xl border border-gray-200 bg-white px-5 py-8 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10"
    >
      <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        Bienvenido al panel de administración
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Desde aquí podrás gestionar clientes y más módulos del sistema Oxígeno Sarita.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'

const summaryCards = [
  { label: 'Clientes activos', value: '—' },
  { label: 'Pedidos del mes', value: '—' },
  { label: 'Cilindros en stock', value: '—' },
  { label: 'Entregas pendientes', value: '—' },
]
</script>
