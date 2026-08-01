<template>
  <div>
    <PageBreadcrumb page-title="Punto de venta" :items="breadcrumbItems" />
    <PosVentaPanel />
  </div>
</template>

<script setup lang="ts">
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import PosVentaPanel from '@/modules/ventas/comprobantes/components/PosVentaPanel.vue'
import { ventasBreadcrumbItems } from '@/modules/ventas/config/ventas-breadcrumb'

const breadcrumbItems = ventasBreadcrumbItems('Punto de venta')
</script>
