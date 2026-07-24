<template>
  <div>
    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          search-placeholder="Cliente, motivo o solicitante..."
        >
          <template #actions>
            <AppHelpTip
              text="Solicitudes de baja de clientes pendientes de aprobación. Solo un administrador distinto al solicitante puede aprobar o rechazar."
            />
          </template>
        </AppListToolbar>
      </template>

      <template #cell-cliente="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{
            row.cliente_razon_social
              ? row.cliente_razon_social
              : [row.cliente_nombres, row.cliente_apellido_paterno, row.cliente_apellido_materno]
                  .filter(Boolean)
                  .join(' ') || '—'
          }}
        </p>
        <p v-if="row.numero_documento" class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.numero_documento }}
        </p>
      </template>

      <template #cell-fecha_creacion="{ value }">
        <span>{{ formatListDate(value as string) }}</span>
      </template>

      <template #cell-nombre_tipo_solicitud="{ value }">
        <AppBadge
          :color="value === 'REACTIVACION' ? 'primary' : 'neutral'"
          variant="light"
          size="sm"
        >
          {{ value === 'REACTIVACION' ? value : value === 'BAJA' ? value : '-' }}
        </AppBadge>
      </template>

      <template #cell-nombre_estado_aprobacion="{ value }">
        <AppBadge :color="getEstadoColor(value as string)" variant="light" size="sm">
          {{ value }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          title="Ver detalle"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetailModal(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>

        <button
          v-if="canAprobar && row.nombre_estado_aprobacion === 'PENDIENTE'"
          type="button"
          title="Aprobar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10"
          @click="openAprobarModal(row)"
        >
          <AppIcon :name="ICONS.check" :size="16" />
        </button>

        <button
          v-if="canAprobar && row.nombre_estado_aprobacion === 'PENDIENTE'"
          type="button"
          title="Rechazar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openRechazarModal(row)"
        >
          <AppIcon :name="ICONS.x" :size="16" />
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="bajasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <AppModal
      v-model="detailModalOpen"
      :title="detailTitle"
      :subtitle="
        solicitudSeleccionada?.cliente_razon_social ?? solicitudSeleccionada?.cliente_nombres ?? ''
      "
      size="lg"
    >
      <DetailCardsLayout :loading="detailQuery.isLoading.value" :sections="detailSections">
        <template #badges>
          <AppBadge :color="getEstadoColor(detailQuery.data.value?.nombre_estado_aprobacion ?? '')">
            {{ detailQuery.data.value?.nombre_estado_aprobacion }}
          </AppBadge>
          <AppBadge :color="getEstadoColor(detailQuery.data.value?.nombre_tipo_solicitud ?? '')">
            {{ detailQuery.data.value?.nombre_tipo_solicitud }}
          </AppBadge>
        </template>
      </DetailCardsLayout>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          @click="detailModalOpen = false"
        >
          Cerrar
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model="aprobarModalOpen"
      :title="aprobarTitle"
      :subtitle="
        solicitudSeleccionada?.cliente_razon_social
          ? solicitudSeleccionada.cliente_razon_social
          : `${solicitudSeleccionada?.cliente_nombres ?? ''} ${solicitudSeleccionada?.cliente_apellido_paterno ?? ''} ${solicitudSeleccionada?.cliente_apellido_materno ?? ''}`.trim()
      "
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        <template v-if="esReactivacion">
          ¿Confirmas la reactivación del cliente
          <span class="font-medium text-gray-800 dark:text-white/90">
            {{
              solicitudSeleccionada?.cliente_razon_social
                ? solicitudSeleccionada.cliente_razon_social
                : `${solicitudSeleccionada?.cliente_nombres ?? ''} ${solicitudSeleccionada?.cliente_apellido_paterno ?? ''} ${solicitudSeleccionada?.cliente_apellido_materno ?? ''}`.trim()
            }}
          </span>
          ?
        </template>
        <template v-else>
          ¿Confirmas la baja del cliente
          <span class="font-medium text-gray-800 dark:text-white/90">
            {{
              solicitudSeleccionada?.cliente_razon_social ?? solicitudSeleccionada?.cliente_nombres
            }}
          </span>
          por motivo
          <span class="font-medium text-gray-800 dark:text-white/90">
            {{ solicitudSeleccionada?.nombre_motivo_baja }}
          </span>
          ?
        </template>
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="aprobarMutation.isPending.value"
          @click="aprobarModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-success-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-success-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="aprobarMutation.isPending.value"
          @click="confirmarAprobacion"
        >
          {{
            aprobarMutation.isPending.value
              ? 'Procesando...'
              : esReactivacion
                ? 'Aprobar reactivación'
                : 'Aprobar baja'
          }}
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model="rechazarModalOpen"
      :title="rechazarTitle"
      :subtitle="
        solicitudSeleccionada?.cliente_razon_social ?? solicitudSeleccionada?.cliente_nombres ?? ''
      "
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <template v-if="esReactivacion">
            La solicitud de reactivación quedará rechazada y el cliente se mantendrá inactivo.
          </template>
          <template v-else>
            La solicitud de baja quedará rechazada y el cliente seguirá activo en el sistema.
          </template>
        </p>
      </div>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="rechazarMutation.isPending.value"
          @click="rechazarModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="rechazarMutation.isPending.value"
          @click="confirmarRechazo"
        >
          {{ rechazarMutation.isPending.value ? 'Procesando...' : 'Rechazar solicitud' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import {
  useAprobarBajaClienteMutation,
  useRechazarBajaClienteMutation,
} from '@/modules/clientes/bajas-cliente/composables/useBajaClienteMutations'
import { useBajaClienteDetailQuery } from '@/modules/clientes/bajas-cliente/composables/useBajaClienteDetailQuery'
import { useBajasClienteQuery } from '@/modules/clientes/bajas-cliente/composables/useBajasClienteQuery'
import type {
  BajaCliente,
  BajaClienteDetail,
} from '@/modules/clientes/bajas-cliente/interfaces/baja-cliente.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { clientesQueryKeys } from '@/modules/clientes/constants/clientesQueryKeys'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import { AppBadge, AppHelpTip, AppListToolbar, AppModal, AppPagination, AppTable } from '@/shared/components'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastSuccess } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListDate, formatDateTime } from '@/shared/utils/date'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import type { TableColumn } from '@/shared/interfaces/table.interface'

withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false,
  },
)

const queryClient = useQueryClient()
const authStore = useAuthStore()

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const bajasQuery = useBajasClienteQuery(filters)
const aprobarMutation = useAprobarBajaClienteMutation()
const rechazarMutation = useRechazarBajaClienteMutation()

const detailModalOpen = ref(false)
const aprobarModalOpen = ref(false)
const rechazarModalOpen = ref(false)
const solicitudSeleccionada = ref<BajaCliente | null>(null)
const motivoRechazo = ref('')

const detailId = ref<number | undefined>(undefined)
const detailEnabled = ref(false)
const detailQuery = useBajaClienteDetailQuery(detailId, detailEnabled)

const esAdministrador = computed(() =>
  authStore.user?.roles?.some((rol) => rol.nombre?.toUpperCase() === 'ADMINISTRADOR'),
)

const canAprobar = computed(
  () => esAdministrador.value && authStore.hasPermission(PermisoBanderas.CLIENTES_EDITAR),
)

const isLoading = computed(() => bajasQuery.isFetching.value || bajasQuery.isLoading.value)

const rows = computed(() => bajasQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'nombre_tipo_solicitud', label: 'Tipo de Solicitud' },
  { key: 'nombre_motivo_baja', label: 'Motivo' },
  { key: 'nombre_usuario_solicita', label: 'Solicitante' },
  { key: 'fecha_creacion', label: 'Solicitado' },
  { key: 'nombre_estado_aprobacion', label: 'Estado' },
]

const esReactivacion = computed(
  () => solicitudSeleccionada.value?.nombre_tipo_solicitud === 'REACTIVACION',
)

const detailTitle = computed(() =>
  esReactivacion.value ? 'Detalle de solicitud de reactivación' : 'Detalle de solicitud de baja',
)

const aprobarTitle = computed(() =>
  esReactivacion.value ? 'Aprobar reactivación de cliente' : 'Aprobar baja de cliente',
)

const rechazarTitle = computed(() =>
  esReactivacion.value ? 'Rechazar solicitud de reactivación' : 'Rechazar solicitud de baja',
)

const detailData = computed<BajaClienteDetail | null>(() => detailQuery.data.value ?? null)

const detailSections = computed<DetailSection[]>(() => {
  const d = detailData.value
  if (!d) return []

  const nombreCliente = [d.cliente_nombres, d.cliente_apellido_paterno, d.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return [
    {
      title: 'Cliente',
      icon: ICONS.building2,
      items: [
        { label: 'Razón social', value: d.cliente_razon_social || '—' },
        { label: 'Nombre', value: nombreCliente || '—' },
        { label: 'Documento', value: d.cliente_numero_documento || '—' },
      ],
    },
    {
      title: 'Solicitud',
      icon: ICONS.fileText,
      items: [
        {
          label: 'Tipo',
          value:
            d.nombre_tipo_solicitud === 'REACTIVACION'
              ? 'Reactivación'
              : (d.nombre_tipo_solicitud ?? 'Baja'),
        },
        ...(d.nombre_tipo_solicitud !== 'REACTIVACION'
          ? [{ label: 'Motivo de baja' as const, value: d.nombre_motivo_baja || '—' }]
          : []),
        { label: 'Detalle', value: d.motivo_detalle || '—', fullWidth: true },
        {
          label: 'Solicitado el',
          value: d.fecha_creacion ? formatListDate(d.fecha_creacion) : '—',
        },
        { label: 'Solicitante', value: d.nombre_usuario_solicita || '—' },
      ],
    },
    {
      title: 'Estado',
      icon: ICONS.alertCircle,
      items: [
        { label: 'Estado', value: d.nombre_estado_aprobacion || '—' },
        {
          label: 'Autorizado por',
          value: d.nombre_usuario_autoriza || '—',
        },
        {
          label: 'Fecha de autorización',
          value: d.fecha_autorizacion ? formatListDate(d.fecha_autorizacion) : '—',
        },
      ],
    },
    {
      title: 'Auditoría',
      icon: ICONS.history,
      items: [
        { label: 'Creado por', value: d.nombre_usuario_creacion || '—' },
        {
          label: 'Fecha de creación',
          value: d.fecha_creacion ? formatDateTime(d.fecha_creacion) : '—',
        },
        { label: 'Modificado por', value: d.nombre_usuario_modificacion || '—' },
        {
          label: 'Última modificación',
          value: d.fecha_modificacion ? formatDateTime(d.fecha_modificacion) : '—',
        },
      ],
    },
  ]
})

const getEstadoColor = (estado: string): 'warning' | 'success' | 'error' | 'neutral' => {
  switch (estado?.toUpperCase()) {
    case 'PENDIENTE':
      return 'warning'

    case 'APROBADA':
      return 'success'

    case 'RECHAZADA':
      return 'error'

    default:
      return 'neutral'
  }
}

const openDetailModal = (row: BajaCliente) => {
  solicitudSeleccionada.value = row
  detailId.value = row.id
  detailEnabled.value = true
  detailModalOpen.value = true
}

const openAprobarModal = (row: BajaCliente) => {
  solicitudSeleccionada.value = row
  aprobarModalOpen.value = true
}

const openRechazarModal = (row: BajaCliente) => {
  solicitudSeleccionada.value = row
  motivoRechazo.value = ''
  rechazarModalOpen.value = true
}

const confirmarAprobacion = async () => {
  const userId = authStore.user?.id
  const solicitud = solicitudSeleccionada.value
  if (!userId || !solicitud) return

  try {
    await aprobarMutation.mutateAsync({
      id: solicitud.id,
      payload: {
        idUsuarioAuditoria: userId,
      },
    })

    if (esReactivacion.value) {
      await clientesService.restaurar(solicitud.id_cliente, userId)
    } else {
      await clientesService.eliminar(solicitud.id_cliente, userId)
    }

    queryClient.invalidateQueries({ queryKey: clientesQueryKeys.lists() })

    if (esReactivacion.value) {
      toastSuccess('Cliente reactivado correctamente')
    } else {
      toastSuccess('Cliente desactivado correctamente')
    }

    aprobarModalOpen.value = false
    detailModalOpen.value = false
  } catch {
    // toast en mutation
  }
}

const confirmarRechazo = async () => {
  const userId = authStore.user?.id
  const solicitud = solicitudSeleccionada.value
  if (!userId || !solicitud) return

  try {
    await rechazarMutation.mutateAsync({
      id: solicitud.id,
      payload: {
        idUsuarioAuditoria: userId,
      },
    })
    rechazarModalOpen.value = false
    detailModalOpen.value = false
  } catch {
    // toast en mutation
  }
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
  }
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 350)
})

watch([pagina, limite], () => {
  syncFilters()
})

watch(detailModalOpen, (open) => {
  if (!open) {
    detailEnabled.value = false
  }
})
</script>
