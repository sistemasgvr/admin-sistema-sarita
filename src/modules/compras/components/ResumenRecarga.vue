<template>
  <DetailSectionCard
    v-if="idRecargaPlanta"
    title="Orden de recarga vinculada"
    :icon="ICONS.cylinder"
    :full-width="true"
  >
    <CompraRecargaPlantaDetalle
      :recarga="balonesQuery.data.value ?? null"
      :loading="balonesQuery.isFetching.value"
      :hint="hintDetalle"
    />
  </DetailSectionCard>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useRecargaPlantaQuery } from '@/modules/balones/recargas/composables/useRecargasPlantaQuery'
import CompraRecargaPlantaDetalle from '@/modules/compras/components/CompraRecargaPlantaDetalle.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  idRecargaPlanta: number | null
  /** Etiqueta opcional (ej. número de orden) — el detalle ya muestra el número de la orden. */
  numero?: string | null
}>()

const hintDetalle =
  'Estos son los cilindros de la orden vinculada a la compra. La cantidad del detalle de productos puede diferir de la capacidad del balón porque el gas se factura agrupado por producto.'

const idRecargaPlantaRef = toRef(props, 'idRecargaPlanta')
const balonesQuery = useRecargaPlantaQuery(idRecargaPlantaRef)
</script>
