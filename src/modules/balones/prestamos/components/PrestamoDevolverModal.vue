<template>
  <AppModal
    v-model="open"
    title="Devolver / reingresar cilindro"
    :subtitle="detalle?.codigo_balon || detalle?.numero_prestamo || undefined"
    size="sm"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Se registrará el reingreso del cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ detalle?.codigo_balon || (detalle?.id_balon ? `#${detalle.id_balon}` : 'sin código') }}
        </span>
        al almacén (movimiento de entrada por devolución) y saldrá del pendiente de días en préstamo.
      </p>

      <AppInput
        v-model="fechaDevolucion"
        label="Fecha de devolución"
        type="date"
        required
      />

      <AlmacenSelectField
        v-model="idAlmacenDestino"
        label="Almacén de destino"
        hint="Donde reingresa el cilindro"
        searchable
        required
        :disabled="almacenesQuery.isLoading.value"
      />
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
        :disabled="devolverMutation.isPending.value || !fechaDevolucion || !idAlmacenDestino"
        @click="confirmDevolver"
      >
        {{ devolverMutation.isPending.value ? 'Registrando...' : 'Devolver' }}
      </button>
    </template>
  </AppModal>

  <GarantiaDevolverModal
    v-model="garantiaModalOpen"
    :id-cliente="detalle?.id_cliente"
    :id-prestamo="detalle?.id_prestamo"
    :id-garantia="garantiaPendienteId"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import GarantiaDevolverModal from '@/modules/balones/garantias/components/GarantiaDevolverModal.vue'
import { garantiasService } from '@/modules/balones/garantias/services/garantias.service'
import { useDevolverPrestamoDetalleMutation } from '@/modules/balones/prestamos/composables/usePrestamoDetalleMutations'
import type { PrestamoDetalle } from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { usePosAlmacenDefault } from '@/modules/ventas/comprobantes/composables/usePosAlmacenDefault'
import { AppInput, AppModal } from '@/shared/components'
import { toastInfo, toastWarning } from '@/shared/composables/useToast'
import { PermisoBanderas } from '@/shared/constants/permissions'

const props = defineProps<{
  detalle?: PrestamoDetalle | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const devolverMutation = useDevolverPrestamoDetalleMutation()
const fechaDevolucion = ref(new Date().toISOString().slice(0, 10))
const idAlmacenDestino = ref<number | ''>('')
const garantiaModalOpen = ref(false)
const garantiaPendienteId = ref<number | null>(null)

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const almacenesData = computed(() => almacenesQuery.data.value?.data)
const { aplicarAlmacenPorDefecto } = usePosAlmacenDefault(almacenesData, idAlmacenDestino)

watch(
  () => [open.value, props.detalle?.id] as const,
  ([isOpen]) => {
    if (!isOpen) return
    fechaDevolucion.value = new Date().toISOString().slice(0, 10)
    idAlmacenDestino.value = props.detalle?.id_almacen ? Number(props.detalle.id_almacen) : ''
    if (!idAlmacenDestino.value) {
      aplicarAlmacenPorDefecto()
    }
  },
)

async function offerGarantiaDevolucion(detalle: PrestamoDetalle) {
  if (!authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_EDITAR)) return
  if (!detalle.id_prestamo && !detalle.id_cliente) return

  try {
    const result = await garantiasService.listar({
      idPrestamo: detalle.id_prestamo || undefined,
      idCliente: detalle.id_prestamo ? undefined : detalle.id_cliente || undefined,
      pagina: 1,
      limite: 20,
    })
    const conSaldo = (result.data ?? []).filter((g) => Number(g.monto_saldo) > 0)
    if (conSaldo.length === 0) return

    const primera = conSaldo[0]
    garantiaPendienteId.value = conSaldo.length === 1 ? primera.id : null
    toastInfo(
      `Hay garantía con saldo S/ ${Number(primera.monto_saldo).toFixed(2)}. Puedes devolverla ahora.`,
    )
    garantiaModalOpen.value = true
  } catch {
    // no bloquear devolución física si falla la consulta de garantía
  }
}

async function confirmDevolver() {
  const detalle = props.detalle
  const userId = authStore.user?.id
  if (!detalle || !userId) return
  if (!fechaDevolucion.value) {
    toastWarning('Indica la fecha de devolución')
    return
  }
  if (!idAlmacenDestino.value) {
    toastWarning('Selecciona el almacén de destino')
    return
  }

  try {
    await devolverMutation.mutateAsync({
      id: detalle.id,
      payload: {
        idUsuarioAuditoria: userId,
        fechaDevolucion: fechaDevolucion.value,
        idAlmacenDestino: Number(idAlmacenDestino.value),
      },
    })
    open.value = false
    emit('saved')
    await offerGarantiaDevolucion(detalle)
  } catch {
    // toast en mutation
  }
}
</script>
