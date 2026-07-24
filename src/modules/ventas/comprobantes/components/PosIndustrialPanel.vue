<template>
  <div class="mx-auto max-w-3xl space-y-4">
    <DetailSectionCard
      title="Operación industrial"
      :icon="ICONS.building2"
      help="En industrial no se cobra alquiler: el cilindro sale en préstamo/comodato, se cobra el contenido (gas) y se registra una garantía reembolsable."
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Usa este flujo para obras y clientes que rotan en días o semanas. No mezcles con
        <strong class="font-medium text-gray-800 dark:text-white/90">Medicinal</strong>,
        donde sí se registra un alquiler con tarifa.
      </p>

      <ol class="mt-5 space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <li class="flex gap-3">
          <span
            class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
          >
            1
          </span>
          <span>
            <span class="font-medium text-gray-800 dark:text-white/90">Préstamo del cilindro</span>
            — comodato sin tarifa de alquiler. Agrega los envases en el detalle del préstamo.
          </span>
        </li>
        <li class="flex gap-3">
          <span
            class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
          >
            2
          </span>
          <span>
            <span class="font-medium text-gray-800 dark:text-white/90">Cobrar el contenido</span>
            — venta del gas en la pestaña Recarga (lo que se factura al cliente).
          </span>
        </li>
        <li class="flex gap-3">
          <span
            class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
          >
            3
          </span>
          <span>
            <span class="font-medium text-gray-800 dark:text-white/90">Garantía reembolsable</span>
            — cobro del depósito; se devuelve al retornar el cilindro.
            <span
              v-if="lastPrestamoId"
              class="mt-1 block text-xs text-brand-600 dark:text-brand-400"
            >
              Último préstamo #{{ lastPrestamoId }}
              <template v-if="lastClienteId">· cliente #{{ lastClienteId }}</template>
            </span>
          </span>
        </li>
      </ol>

      <div class="mt-6 flex flex-wrap gap-2">
        <button
          v-if="canCreatePrestamo"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
          @click="openPrestamoModal"
        >
          <AppIcon :name="ICONS.plus" :size="18" />
          Registrar préstamo
        </button>
        <button
          v-if="canRecarga"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
          @click="irARecarga"
        >
          <AppIcon :name="ICONS.cylinder" :size="18" />
          Cobrar contenido (recarga)
        </button>
        <button
          v-if="canCobrarGarantia"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
          @click="openGarantiaModal"
        >
          <AppIcon :name="ICONS.shield" :size="18" />
          Cobrar garantía
        </button>
        <RouterLink
          v-if="canListPrestamos"
          to="/admin/balones/prestamos"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <AppIcon :name="ICONS.externalLink" :size="16" />
          Ver préstamos
        </RouterLink>
      </div>

      <p
        v-if="!canCreatePrestamo && !canRecarga && !canCobrarGarantia"
        class="mt-4 text-sm text-amber-600 dark:text-amber-400"
      >
        No tienes permisos para préstamos, recargas ni garantía. Solicita acceso al administrador.
      </p>
    </DetailSectionCard>

    <PrestamoFormModal
      v-model="prestamoModalOpen"
      mode="create"
      @saved="onPrestamoSaved"
    />

    <GarantiaCobrarModal
      v-model="garantiaModalOpen"
      :id-cliente="lastClienteId"
      :id-prestamo="lastPrestamoId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import GarantiaCobrarModal from '@/modules/balones/garantias/components/GarantiaCobrarModal.vue'
import PrestamoFormModal from '@/modules/balones/prestamos/components/PrestamoFormModal.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { toastSuccess } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

const router = useRouter()
const authStore = useAuthStore()

const prestamoModalOpen = ref(false)
const garantiaModalOpen = ref(false)
const lastPrestamoId = ref<number | null>(null)
const lastClienteId = ref<number | null>(null)

const canCreatePrestamo = computed(() =>
  authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR),
)
const canListPrestamos = computed(() =>
  authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_LISTAR),
)
const canRecarga = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR),
)
const canCobrarGarantia = computed(() =>
  authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR),
)

function openPrestamoModal() {
  prestamoModalOpen.value = true
}

function openGarantiaModal() {
  garantiaModalOpen.value = true
}

function onPrestamoSaved(payload?: { id: number; idCliente?: number | null }) {
  if (payload?.id) {
    lastPrestamoId.value = payload.id
    lastClienteId.value = payload.idCliente ?? null
    toastSuccess(
      'Préstamo registrado. Puedes cobrar el contenido en Recarga y la garantía en el paso 3.',
    )
    return
  }
  toastSuccess('Préstamo actualizado.')
}

function irARecarga() {
  router.replace({ query: { tab: 'recarga' } })
}
</script>
