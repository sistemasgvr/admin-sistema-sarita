<template>
  <div class="space-y-4">
    <DetailSectionCard
      title="¿Qué necesita el cliente?"
      :icon="ICONS.cylinder"
          help="Elige una opción. El formulario cambia según lo que necesite el cliente."
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button
          v-for="escenario in escenariosVisibles"
          :key="escenario.key"
          type="button"
          :class="escenarioCardClass(escenario.key)"
          @click="seleccionarEscenario(escenario.key)"
        >
          <div class="flex items-start gap-3">
            <span
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              :class="
                escenarioActivo === escenario.key
                  ? 'bg-white/20 text-white'
                  : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
              "
            >
              <AppIcon :name="escenario.icon" :size="18" />
            </span>
            <span class="min-w-0 text-left">
              <span class="block text-sm font-semibold">{{ escenario.label }}</span>
              <span
                class="mt-1 block text-xs leading-snug"
                :class="
                  escenarioActivo === escenario.key
                    ? 'text-white/85'
                    : 'text-gray-500 dark:text-gray-400'
                "
              >
                {{ escenario.descripcion }}
              </span>
            </span>
          </div>
        </button>
      </div>
    </DetailSectionCard>

    <PosRecargaPanel v-if="escenarioActivo === 'solo_gas'" />

    <PosAlquilerPanel v-else-if="escenarioActivo === 'kit'" />

    <div v-else-if="escenarioActivo === 'prestamo'" class="space-y-4">
      <DetailSectionCard
        title="Préstamo industrial"
        :icon="ICONS.building2"
        help="Le damos un cilindro de la empresa (sin alquiler). Cobras el gas y, si aplica, una garantía que se devuelve."
      >
        <ol class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <li class="flex gap-3">
            <span
              class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
            >
              1
            </span>
            <span>
              <span class="font-medium text-gray-800 dark:text-white/90">Registrar préstamo</span>
              — entrega el cilindro de la empresa al cliente.
            </span>
          </li>
          <li class="flex gap-3">
            <span
              class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
            >
              2
            </span>
            <span>
              <span class="font-medium text-gray-800 dark:text-white/90">Cobrar el gas</span>
              — contenido que se factura.
            </span>
          </li>
          <li class="flex gap-3">
            <span
              class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
            >
              3
            </span>
            <span>
              <span class="font-medium text-gray-800 dark:text-white/90">Cobrar garantía</span>
              — depósito que se devuelve cuando traiga el cilindro.
              <span
                v-if="lastPrestamoId"
                class="mt-1 block text-xs text-brand-600 dark:text-brand-400"
              >
                Último préstamo #{{ lastPrestamoId }}
                <template v-if="lastClienteId"> · cliente #{{ lastClienteId }}</template>
              </span>
            </span>
          </li>
        </ol>

        <div class="mt-5 flex flex-wrap gap-2">
          <button
            v-if="canRecarga"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-600 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
            @click="seleccionarEscenario('solo_gas')"
          >
            <AppIcon :name="ICONS.cylinder" :size="16" />
            Cobrar gas (recarga)
          </button>
          <RouterLink
            v-if="canListPrestamos"
            to="/admin/balones/prestamos"
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <AppIcon :name="ICONS.externalLink" :size="16" />
            Ver préstamos
          </RouterLink>
        </div>
        <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          El préstamo de cilindro se registra al vender el balón en el pedido (cobras el gas y la
          garantía desde la misma venta).
        </p>
      </DetailSectionCard>
    </div>
      </DetailSectionCard>

      <PrestamoFormModal v-model="prestamoModalOpen" mode="create" @saved="onPrestamoSaved" />
      <GarantiaCobrarModal
        v-model="garantiaModalOpen"
        :id-cliente="lastClienteId"
        :id-prestamo="lastPrestamoId"
      />
    </div>

    <div
      v-else
      class="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"
    >
      Selecciona un escenario para continuar.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import PosAlquilerPanel from '@/modules/ventas/comprobantes/components/PosAlquilerPanel.vue'
import PosRecargaPanel from '@/modules/ventas/comprobantes/components/PosRecargaPanel.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { ICONS, type IconName } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

export type EscenarioCilindro = 'solo_gas' | 'prestamo' | 'kit'

const props = defineProps<{
  /** Escenario preferido al entrar (p. ej. desde ?tab=recarga). */
  escenarioPreferido?: EscenarioCilindro | null
}>()

const authStore = useAuthStore()

const canRecarga = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR),
)
const canKit = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR))
const canListPrestamos = computed(() =>
  authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_LISTAR),
)

const escenarioActivo = ref<EscenarioCilindro | null>(null)

const escenarios = computed(() => {
  const items: Array<{
    key: EscenarioCilindro
    label: string
    descripcion: string
    icon: IconName
    visible: boolean
  }> = [
    {
      key: 'solo_gas',
      label: 'Solo recargar',
      descripcion: 'El cliente ya tiene el cilindro. Solo cobramos el gas.',
      icon: ICONS.cylinder,
      visible: canRecarga.value,
    },
    {
      key: 'prestamo',
      label: 'Prestar cilindro',
      descripcion: 'Le damos un cilindro de la empresa. Cobramos gas y, si aplica, garantía.',
      icon: ICONS.building2,
      visible: canPrestamo.value || canRecarga.value || canListPrestamos.value,
    },
    {
      key: 'kit',
      label: 'Kit medicinal',
      descripcion: 'Regulador en alquiler + cilindro medicinal. Puedes sumar extras.',
      icon: ICONS.boxes,
      visible: canKit.value,
    },
  ]
  return items
})

const escenariosVisibles = computed(() => escenarios.value.filter((item) => item.visible))

function escenarioCardClass(key: EscenarioCilindro) {
  const base =
    'rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
  return escenarioActivo.value === key
    ? `${base} border-brand-500 bg-brand-500 text-white shadow-theme-xs`
    : `${base} border-gray-200 bg-white hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/40`
}

function seleccionarEscenario(key: EscenarioCilindro) {
  escenarioActivo.value = escenarioActivo.value === key ? null : key
}

watch(
  [() => props.escenarioPreferido, escenariosVisibles],
  ([preferido, visibles]) => {
    if (escenarioActivo.value) return
    if (preferido && visibles.some((item) => item.key === preferido)) {
      escenarioActivo.value = preferido
      return
    }
    if (visibles.length === 1) {
      escenarioActivo.value = visibles[0].key
    }
  },
  { immediate: true },
)
</script>
