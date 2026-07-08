<template>
  <AppModal
    v-model="open"
    title="Detalle del tipo de balón"
    :subtitle="tipo?.nombre"
    size="lg"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <AppBadge v-if="tipo?.nombre_gas" color="primary">{{ tipo.nombre_gas }}</AppBadge>
        <AppBadge color="neutral">{{ tipo?.total_balones ?? 0 }} cilindros</AppBadge>
      </template>
    </DetailCardsLayout>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import {
  formatDetailCapacity,
  formatDetailDateTime,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { useTipoBalonQuery } from '@/modules/balones/tipos-balon/composables/useTiposBalonQuery'
import { AppBadge, AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{ tipoId?: number | null }>()
const open = defineModel<boolean>({ default: false })

const tipoIdRef = toRef(() => props.tipoId)
const tipoQuery = useTipoBalonQuery(tipoIdRef)

const isLoading = computed(() => tipoQuery.isFetching.value)
const tipo = computed(() => tipoQuery.data.value ?? null)

const sections = computed<DetailSection[]>(() => {
  const data = tipo.value
  if (!data) return []

  return [
    {
      title: 'Datos del tipo',
      icon: ICONS.layers,
      items: [
        { label: 'Nombre', value: data.nombre },
        { label: 'Gas', value: data.nombre_gas },
        { label: 'Código gas', value: data.codigo_gas },
        {
          label: 'Capacidad',
          value: formatDetailCapacity(data.capacidad, data.nombre_unidad_medida),
        },
        { label: 'Peso', value: data.peso != null ? `${data.peso} kg` : undefined },
        {
          label: 'Vigencia P.H.',
          value: data.vigencia_ph_anios != null ? `${data.vigencia_ph_anios} años` : undefined,
        },
      ],
    },
    {
      title: 'Auditoría',
      icon: ICONS.userCircle,
      items: [
        { label: 'Cilindros asociados', value: data.total_balones?.toString() },
        { label: 'Creado por', value: data.nombre_usuario_creacion },
        { label: 'Modificado por', value: data.nombre_usuario_modificacion },
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>
