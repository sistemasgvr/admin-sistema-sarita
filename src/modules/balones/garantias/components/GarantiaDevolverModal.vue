<template>
  <AppModal
    v-model="open"
    title="Devolver garantía"
    subtitle="Registra la devolución parcial o total del depósito (MVP: sin NC automática)."
    size="md"
  >
    <div class="space-y-4">
      <AppSelect
        v-model="garantiaId"
        label="Garantía"
        placeholder="Selecciona garantía con saldo"
        required
        :options="garantiaOptions"
        :disabled="garantiasQuery.isFetching.value || Boolean(props.idGarantia)"
      />

      <div
        v-if="garantiaSeleccionada"
        class="rounded-xl border border-gray-100 p-3 text-sm dark:border-gray-800"
      >
        <p class="text-gray-500 dark:text-gray-400">Saldo pendiente</p>
        <p class="font-medium text-gray-800 dark:text-white/90">
          S/ {{ Number(garantiaSeleccionada.monto_saldo).toFixed(2) }}
          <span class="ml-2 text-xs font-normal text-gray-500">
            (cobrado {{ Number(garantiaSeleccionada.monto_cobrado).toFixed(2) }} ·
            devuelto {{ Number(garantiaSeleccionada.monto_devuelto).toFixed(2) }})
          </span>
        </p>
        <p
          v-if="garantiaSeleccionada.nombre_producto || garantiaSeleccionada.numero_prestamo"
          class="mt-1 text-xs text-gray-500 dark:text-gray-400"
        >
          {{
            [
              garantiaSeleccionada.nombre_producto,
              garantiaSeleccionada.numero_prestamo
                ? `Préstamo ${garantiaSeleccionada.numero_prestamo}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')
          }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AppInput
          v-model="monto"
          label="Monto a devolver"
          type="number"
          min="0"
          step="0.01"
          required
        />
        <AppInput v-model="fecha" label="Fecha" type="date" required />
        <AppInput
          v-model="idComprobante"
          label="ID comprobante NC (opcional)"
          type="number"
          min="1"
          step="1"
          hint="Si ya emitiste la NC, indica su id para vincularla."
          class="sm:col-span-2"
        />
        <AppInput
          v-model="observacion"
          label="Observación"
          placeholder="Opcional"
          class="sm:col-span-2"
        />
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="devolverMutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="devolverMutation.isPending.value || !puedeDevolver"
        @click="confirmar"
      >
        {{ devolverMutation.isPending.value ? 'Registrando...' : 'Devolver garantía' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDevolverGarantiaMutation } from '@/modules/balones/garantias/composables/useGarantiaMutations'
import { useGarantiasQuery } from '@/modules/balones/garantias/composables/useGarantiasQuery'
import type { GarantiaListFilters } from '@/modules/balones/garantias/interfaces/garantia.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import { toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{
  idCliente?: number | null
  idPrestamo?: number | null
  idGarantia?: number | null
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const devolverMutation = useDevolverGarantiaMutation()

const garantiaId = ref<number | ''>('')
const monto = ref(0)
const fecha = ref(new Date().toISOString().slice(0, 10))
const idComprobante = ref<number | ''>('')
const observacion = ref('')

const filters = ref<GarantiaListFilters>({
  pagina: 1,
  limite: 50,
  idCliente: undefined,
  idPrestamo: undefined,
})
const garantiasQuery = useGarantiasQuery(filters)

const garantiasConSaldo = computed(() =>
  (garantiasQuery.data.value?.data ?? []).filter((g) => Number(g.monto_saldo) > 0),
)

const garantiaOptions = computed(() =>
  garantiasConSaldo.value.map((g) => ({
    value: g.id,
    label: `#${g.id} — ${g.nombre_cliente || 'Cliente'} · saldo S/ ${Number(g.monto_saldo).toFixed(2)} (${g.nombre_estado || 'ACTIVA'})`,
  })),
)

const garantiaSeleccionada = computed(() =>
  garantiasConSaldo.value.find((g) => g.id === garantiaId.value) ??
  (garantiasQuery.data.value?.data ?? []).find((g) => g.id === garantiaId.value),
)

const puedeDevolver = computed(
  () =>
    Boolean(garantiaId.value) &&
    Number(monto.value) > 0 &&
    Boolean(fecha.value) &&
    (!garantiaSeleccionada.value ||
      Number(monto.value) <= Number(garantiaSeleccionada.value.monto_saldo)),
)

watch(
  () => [open.value, props.idCliente, props.idPrestamo, props.idGarantia] as const,
  ([isOpen]) => {
    if (!isOpen) return
    filters.value = {
      pagina: 1,
      limite: 50,
      idCliente: props.idCliente ?? undefined,
      idPrestamo: props.idPrestamo ?? undefined,
    }
    garantiaId.value = props.idGarantia ?? ''
    fecha.value = new Date().toISOString().slice(0, 10)
    idComprobante.value = ''
    observacion.value = ''
    monto.value = 0
  },
)

watch(
  () => [garantiasConSaldo.value, garantiaId.value, open.value] as const,
  ([rows, selected, isOpen]) => {
    if (!isOpen) return
    if (!selected && rows.length === 1) {
      garantiaId.value = rows[0].id
    }
    const g = rows.find((row) => row.id === (selected || garantiaId.value))
    if (g && Number(monto.value) <= 0) {
      monto.value = Number(g.monto_saldo)
    }
  },
)

watch(garantiaId, (value) => {
  const g = garantiasConSaldo.value.find((row) => row.id === value)
  if (g) {
    monto.value = Number(g.monto_saldo)
  }
})

async function confirmar() {
  const userId = authStore.user?.id
  if (!userId || !puedeDevolver.value || !garantiaId.value) {
    toastWarning('Indica garantía, monto válido y fecha')
    return
  }

  try {
    await devolverMutation.mutateAsync({
      id: Number(garantiaId.value),
      payload: {
        idUsuarioAuditoria: userId,
        monto: Number(monto.value),
        idComprobante: idComprobante.value ? Number(idComprobante.value) : undefined,
        fecha: fecha.value,
        observacion: observacion.value.trim() || undefined,
      },
    })
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation
  }
}
</script>
