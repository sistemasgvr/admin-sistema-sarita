<template>
  <AppModal v-model="open" title="Devolver garantía" size="md" :z-index="100000">
    <div v-if="garantia" class="space-y-4">
      <div class="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
        <div class="col-span-2">
          <p class="text-xs text-gray-400 dark:text-gray-500">Cliente</p>
          <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
            {{ garantia.nombre_cliente || '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Saldo pendiente</p>
          <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {{ formatCurrency(garantia.monto_saldo) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Método recibido</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ garantia.medio_pago || '—' }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Monto a devolver" required :error="errores.monto">
          <div @keydown="bloquearTeclasInvalidas" @paste="bloquearPegadoInvalido" @focusout="normalizarMonto">
            <AppInput
              v-model="form.monto"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              :state="errores.monto ? 'error' : 'default'"
            />
          </div>
        </AppFormField>

        <AppFormField label="Fecha" required :error="errores.fecha">
          <AppInput
            v-model="form.fecha"
            type="date"
            :state="errores.fecha ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField
          label="Método de reembolso"
          optional
          :error="errores.idMedioReembolso"
          class="sm:col-span-2"
        >
          <AppSelect
            v-model="form.idMedioReembolso"
            :options="medioPagoOptions"
            placeholder="Selecciona el método"
          />
        </AppFormField>
      </div>

      <AppFormField label="Observaciones" optional :error="errores.observacion">
        <AppTextarea
          v-model="form.observacion"
          :rows="3"
          placeholder="Ej.: entregado en tienda, voucher #123..."
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
        {{ mutation.isPending.value ? 'Guardando...' : 'Registrar devolución' }}
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
import { formatCurrency, normalizeMoneyInput, parseMoneyInput } from '@/shared/utils/currency'

const props = defineProps<{ garantia: Garantia | null }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const mutation = useReembolsarGarantiaMutation()

const mediosQuery = useMediosPagoQuery()
const medioPagoOptions = computed<SelectOption[]>(() => [
  { label: '— No especificado —', value: '' },
  ...(mediosQuery.data.value ?? []).map((m) => ({ label: m.nombre, value: m.id })),
])

const form = reactive({
  monto: '' as string | number,
  fecha: new Date().toISOString().slice(0, 10),
  idMedioReembolso: '' as string | number,
  observacion: '',
})
const errores = reactive<Record<string, string | undefined>>({})

watch(
  () => [open.value, props.garantia] as const,
  ([isOpen, g]) => {
    if (!isOpen || !g) return
    Object.keys(errores).forEach((k) => (errores[k] = undefined))
    form.monto = Number(g.monto_saldo).toFixed(2)
    form.fecha = new Date().toISOString().slice(0, 10)
    form.idMedioReembolso = ''
    form.observacion = ''
  },
)

const bloquearTeclasInvalidas = (e: KeyboardEvent) => {
  if (e.key.length > 1) return
  if (e.ctrlKey || e.metaKey) return
  if (['-', '+', 'e', 'E'].includes(e.key)) { e.preventDefault(); return }
  if (!/[\d.,]/.test(e.key)) e.preventDefault()
}
const bloquearPegadoInvalido = (e: ClipboardEvent) => {
  const texto = e.clipboardData?.getData('text') ?? ''
  if (/[-+eE]/.test(texto)) e.preventDefault()
}
const normalizarMonto = () => {
  const norm = normalizeMoneyInput(form.monto)
  if (norm) form.monto = norm
}

const validar = (): boolean => {
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
  let ok = true
  if (!form.fecha) { errores.fecha = 'La fecha es obligatoria'; ok = false }
  const monto = parseMoneyInput(form.monto)
  const saldo = Number(props.garantia?.monto_saldo ?? 0)
  if (monto == null || monto <= 0) {
    errores.monto = 'Ingresa un monto válido'
    ok = false
  } else if (monto > saldo) {
    errores.monto = `No puede superar el saldo (${formatCurrency(saldo)})`
    ok = false
  }
  if (form.observacion.length > 500) { errores.observacion = 'Máximo 500 caracteres'; ok = false }
  return ok
}

const submit = async () => {
  if (!props.garantia) return
  normalizarMonto()
  if (!validar()) return

  try {
    await mutation.mutateAsync({
      id: props.garantia.id,
      payload: {
        monto: Math.round((parseMoneyInput(form.monto) ?? 0) * 100) / 100,
        fecha: form.fecha,
        idMedioReembolso: form.idMedioReembolso ? Number(form.idMedioReembolso) : undefined,
        observacion: form.observacion.trim() || undefined,
        idUsuarioAuditoria: authStore.user?.id ?? undefined,
      },
    })
    open.value = false
    emit('saved')
  } catch {
    /* toast en mutación */
  }
}
</script>
