<template>
  <AppModal v-model="open" title="Registrar reembolso de garantía" size="md" :z-index="100000">
    <div v-if="garantia" class="space-y-4">
      <!-- Contexto de la garantía (solo lectura) -->
      <div class="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Cliente</p>
          <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
            {{ garantia.cliente }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Importe a devolver</p>
          <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {{ formatCurrency(garantia.importe) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Fecha de recepción</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatListDate(garantia.fecha) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Método de pago recibido</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ garantia.medio_pago || '—' }}</p>
        </div>
      </div>

      <!-- Formulario del reembolso -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Fecha del reembolso" required :error="errores.fechaReembolso">
          <AppInput
            v-model="form.fechaReembolso"
            type="date"
            :min="garantia.fecha"
            :state="errores.fechaReembolso ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField label="Método de pago del reembolso" required :error="errores.idMedioReembolso">
          <AppSelect
            v-model="form.idMedioReembolso"
            :options="medioPagoOptions"
            placeholder="Selecciona el método"
            :state="errores.idMedioReembolso ? 'error' : 'default'"
          />
        </AppFormField>
      </div>

      <AppFormField label="Observaciones del reembolso" optional :error="errores.observacionReembolso">
        <AppTextarea
          v-model="form.observacionReembolso"
          :rows="3"
          placeholder="Ej.: entregado en tienda, voucher #123, retiro por cajero..."
        />
      </AppFormField>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="mutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="mutation.isPending.value"
        @click="submit"
      >
        {{ mutation.isPending.value ? 'Guardando...' : 'Registrar reembolso' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
import { useReembolsarGarantiaMutation } from '@/modules/finanzas/composables/useGarantiaMutations'
import type { Garantia } from '@/modules/finanzas/interfaces/garantia.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'

const props = defineProps<{ garantia: Garantia | null }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const mutation = useReembolsarGarantiaMutation()

const mediosQuery = useMediosPagoQuery()
const medioPagoOptions = computed<SelectOption[]>(() =>
  (mediosQuery.data.value ?? []).map((m) => ({ label: m.nombre, value: m.id })),
)

const hoy = () => new Date().toISOString().slice(0, 10)

const form = reactive({
  fechaReembolso: hoy(),
  idMedioReembolso: '' as string | number,
  observacionReembolso: '',
})

const errores = reactive<Record<string, string | undefined>>({})

const resetForm = () => {
  // Fecha default: hoy, pero nunca antes de la fecha de recepción
  const h = hoy()
  form.fechaReembolso =
    props.garantia?.fecha && h < props.garantia.fecha ? props.garantia.fecha : h
  form.idMedioReembolso = props.garantia?.id_medio_pago ?? ''
  form.observacionReembolso = ''
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

watch(() => form.fechaReembolso, (v) => {
  if (v && props.garantia?.fecha && v >= props.garantia.fecha) errores.fechaReembolso = undefined
})
watch(() => form.idMedioReembolso, (v) => { if (v) errores.idMedioReembolso = undefined })
watch(() => form.observacionReembolso, (v) => {
  if (v.length <= 500) errores.observacionReembolso = undefined
})

const validar = (): boolean => {
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
  let ok = true

  if (!form.fechaReembolso) {
    errores.fechaReembolso = 'La fecha del reembolso es obligatoria'
    ok = false
  } else if (props.garantia?.fecha && form.fechaReembolso < props.garantia.fecha) {
    errores.fechaReembolso = `No puede ser anterior a la recepción (${props.garantia.fecha})`
    ok = false
  }

  if (!form.idMedioReembolso) {
    errores.idMedioReembolso = 'Selecciona el método del reembolso'
    ok = false
  }

  if (form.observacionReembolso.length > 500) {
    errores.observacionReembolso = 'Máximo 500 caracteres'
    ok = false
  }
  return ok
}

const submit = async () => {
  if (!props.garantia || !validar()) return

  try {
    await mutation.mutateAsync({
      id: props.garantia.id,
      payload: {
        fechaReembolso: form.fechaReembolso,
        idMedioReembolso: Number(form.idMedioReembolso),
        observacionReembolso: form.observacionReembolso.trim() || undefined,
        idUsuarioAuditoria: authStore.user?.id ?? undefined,
      },
    })
    open.value = false
    emit('saved')
  } catch {
    // Toast lo maneja la mutación
  }
}
</script>
