<template>
  <AppModal v-model="open" :title="titulo" :subtitle="subtitulo" size="md">
    <div v-if="cuenta" class="space-y-4">
      <!-- Contexto no editable (solo lectura) -->
      <div class="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ terceroLabel }}</p>
          <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
            {{ cuenta.tercero }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Saldo</p>
          <p class="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {{ formatCurrency(cuenta.saldo) }}
          </p>
        </div>
      </div>

      <!-- Aviso de restricciones -->
      <div
        v-if="restringido"
        class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10"
      >
        <AppIcon :name="ICONS.alertCircle" :size="16" class="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p class="text-xs text-amber-700 dark:text-amber-300">
          <template v-if="esPlan">
            Esta cuenta es un plan de cuotas: solo puedes editar campos descriptivos.
          </template>
          <template v-else-if="tienePagos">
            Esta cuenta ya tiene pagos aplicados: solo puedes editar descripción, observación, comprobante y fecha de vencimiento.
          </template>
        </p>
      </div>

      <!-- Campos "financieros" (solo si no hay restricción) -->
      <template v-if="!restringido">
        <AppFormField label="Fecha de emisión" required :error="errores.fechaEmision">
          <AppInput
            v-model="form.fechaEmision"
            type="date"
            :state="errores.fechaEmision ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField label="Monto" required :error="errores.monto">
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
      </template>

      <!-- Fecha vencimiento: solo para cuentas simples -->
      <AppFormField v-if="!esPlan" label="Fecha de vencimiento" optional :error="errores.fechaVencimiento">
        <AppInput
          v-model="form.fechaVencimiento"
          type="date"
          :min="fechaEmisionMin"
          :state="errores.fechaVencimiento ? 'error' : 'default'"
        />
      </AppFormField>

      <!-- Comprobante -->
      <AppFormField label="N° de comprobante / documento" optional :error="errores.numeroComprobante">
        <AppInput
          v-model="form.numeroComprobante"
          type="text"
          placeholder="Opcional. Ej.: F001-000123, BCP-OP-88121, etc."
          maxlength="50"
          :state="errores.numeroComprobante ? 'error' : 'default'"
        />
      </AppFormField>

      <AppFormField label="Descripción / concepto" optional :error="errores.descripcion">
        <AppInput
          v-model="form.descripcion"
          type="text"
          maxlength="255"
          :state="errores.descripcion ? 'error' : 'default'"
        />
      </AppFormField>

      <AppFormField label="Observación" optional :error="errores.observacion">
        <AppTextarea v-model="form.observacion" :rows="3" />
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
        {{ mutation.isPending.value ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useActualizarCuentaMutation } from '@/modules/finanzas/composables/usePagoMutations'
import type {
  ActualizarCuentaPayload,
  CuentaFinanciera,
  TipoCuenta,
} from '@/modules/finanzas/interfaces/cuenta.interface'
import { ICONS } from '@/shared/constants/icons'
import { formatCurrency, normalizeMoneyInput, parseMoneyInput } from '@/shared/utils/currency'

const props = defineProps<{
  cuenta: CuentaFinanciera | null
  tipo: TipoCuenta
  /** Si viene true, restringe la edición a solo campos descriptivos
   *  (el backend también lo valida por su cuenta). */
  tienePagos?: boolean
}>()

const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const mutation = useActualizarCuentaMutation(props.tipo)

const esPlan = computed(() => (props.cuenta?.numero_cuotas_total ?? null) !== null)
const restringido = computed(() => esPlan.value || !!props.tienePagos)

const titulo = computed(() =>
  props.tipo === 'COBRAR' ? 'Editar cuenta por cobrar' : 'Editar cuenta por pagar',
)
const subtitulo = computed(() =>
  esPlan.value
    ? 'Solo campos descriptivos disponibles para planes de cuotas.'
    : props.tienePagos
      ? 'Solo campos descriptivos disponibles: la cuenta ya tiene pagos.'
      : 'Edita los campos que necesites.',
)
const terceroLabel = computed(() => (props.tipo === 'COBRAR' ? 'Cliente / Tercero' : 'Proveedor / Tercero'))

const fechaEmisionMin = computed(() => props.cuenta?.fecha_emision ?? undefined)

interface FormState {
  fechaEmision: string
  fechaVencimiento: string
  monto: string | number
  numeroComprobante: string
  descripcion: string
  observacion: string
}

const form = reactive<FormState>({
  fechaEmision: '',
  fechaVencimiento: '',
  monto: '',
  numeroComprobante: '',
  descripcion: '',
  observacion: '',
})

const errores = reactive<Record<string, string | undefined>>({})

const cargarDesdeCuenta = () => {
  const c = props.cuenta
  if (!c) return
  form.fechaEmision = c.fecha_emision ?? ''
  form.fechaVencimiento = c.fecha_vencimiento ?? ''
  form.monto = Number(c.monto_pendiente ?? 0).toFixed(2)
  form.numeroComprobante = c.numero_comprobante ?? ''
  form.descripcion = c.descripcion ?? ''
  form.observacion = c.observacion ?? ''
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
}

watch(open, (isOpen) => {
  if (isOpen) cargarDesdeCuenta()
})

/* Validación reactiva */
watch(
  () => form.fechaEmision,
  (v) => {
    if (v) errores.fechaEmision = undefined
    if (!form.fechaVencimiento || v <= form.fechaVencimiento) {
      errores.fechaVencimiento = undefined
    }
  },
)
watch(
  () => form.fechaVencimiento,
  (v) => {
    if (!v || !form.fechaEmision || v >= form.fechaEmision) {
      errores.fechaVencimiento = undefined
    }
  },
)
watch(
  () => form.monto,
  (v) => {
    const n = parseMoneyInput(v)
    if (n != null && n > 0) errores.monto = undefined
  },
)
watch(
  () => form.numeroComprobante,
  (v) => {
    if (v.length <= 50) errores.numeroComprobante = undefined
  },
)
watch(
  () => form.descripcion,
  (v) => {
    if (v.length <= 255) errores.descripcion = undefined
  },
)
watch(
  () => form.observacion,
  (v) => {
    if (v.length <= 500) errores.observacion = undefined
  },
)

/* Handlers monto (input text para no perder comas de miles) */
const bloquearTeclasInvalidas = (e: KeyboardEvent) => {
  if (e.key.length > 1) return
  if (e.ctrlKey || e.metaKey) return
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault()
    return
  }
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

  if (!restringido.value) {
    if (!form.fechaEmision) {
      errores.fechaEmision = 'La fecha de emisión es obligatoria'
      ok = false
    }
    const monto = parseMoneyInput(form.monto)
    if (monto == null || monto <= 0) {
      errores.monto = 'Ingresa un monto válido mayor a cero'
      ok = false
    }
  }

  if (!esPlan.value && form.fechaVencimiento && form.fechaEmision && form.fechaVencimiento < form.fechaEmision) {
    errores.fechaVencimiento = 'No puede ser anterior a la emisión'
    ok = false
  }

  if (form.numeroComprobante.length > 50) {
    errores.numeroComprobante = 'Máximo 50 caracteres'
    ok = false
  }
  if (form.descripcion.length > 255) {
    errores.descripcion = 'Máximo 255 caracteres'
    ok = false
  }
  if (form.observacion.length > 500) {
    errores.observacion = 'Máximo 500 caracteres'
    ok = false
  }

  return ok
}

const submit = async () => {
  if (!props.cuenta) return
  normalizarMonto()
  if (!validar()) return

  const original = props.cuenta

  const payload: ActualizarCuentaPayload = {
    idUsuarioAuditoria: authStore.user?.id ?? undefined,
  }

  // Solo mandar los campos que realmente cambiaron
  if (!restringido.value) {
    if (form.fechaEmision !== (original.fecha_emision ?? '')) {
      payload.fechaEmision = form.fechaEmision
    }
    const nuevoMonto = parseMoneyInput(form.monto)
    if (nuevoMonto != null && Math.abs(nuevoMonto - Number(original.monto_pendiente)) > 0.0001) {
      payload.monto = Math.round(nuevoMonto * 100) / 100
    }
  }

  if (!esPlan.value) {
    const originalVenc = original.fecha_vencimiento ?? ''
    if (form.fechaVencimiento !== originalVenc) {
      payload.fechaVencimiento = form.fechaVencimiento || undefined
    }
  }

  const originalComp = original.numero_comprobante ?? ''
  if (form.numeroComprobante.trim() !== originalComp) {
    payload.numeroComprobante = form.numeroComprobante.trim() || ''
  }

  const originalDesc = original.descripcion ?? ''
  if (form.descripcion.trim() !== originalDesc) {
    payload.descripcion = form.descripcion.trim() || ''
  }

  const originalObs = original.observacion ?? ''
  if (form.observacion.trim() !== originalObs) {
    payload.observacion = form.observacion.trim() || ''
  }

  try {
    await mutation.mutateAsync({ id: original.id, payload })
    open.value = false
    emit('saved')
  } catch {
    // Toast lo maneja la mutación
  }
}
</script>
