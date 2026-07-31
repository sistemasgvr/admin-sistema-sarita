<template>
  <AppModal v-model="open" :title="titulo" :subtitle="subtitulo" size="md">
    <div class="space-y-4">
      <!-- Aviso: cuenta manual -->
      <div
        class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10"
      >
        <AppIcon :name="ICONS.alertCircle" :size="16" class="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p class="text-xs text-amber-700 dark:text-amber-300">
          Usa este formulario solo para cuentas <strong>externas</strong> (préstamos, aportes,
          devoluciones esperadas, etc.). Las cuentas que nacen de una venta o compra se generan
          automáticamente desde su propio módulo.
        </p>
      </div>

      <AppSelectSearch
        v-model="form.idTercero"
        :options="terceroOptions"
        v-model:search="terceroSearch"
        :label="terceroLabel"
        :placeholder="`Selecciona un ${terceroLabel.toLowerCase()}`"
        search-placeholder="Buscar por nombre o documento..."
        remote
        :loading="clientesQuery.isFetching.value"
        required
        :error="errores.idTercero"
      />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Fecha de emisión" required :error="errores.fechaEmision">
          <AppInput
            v-model="form.fechaEmision"
            type="date"
            :state="errores.fechaEmision ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField label="Fecha de vencimiento" optional :error="errores.fechaVencimiento">
          <AppInput
            v-model="form.fechaVencimiento"
            type="date"
            :state="errores.fechaVencimiento ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField label="Monto" required :error="errores.monto" class="sm:col-span-2">
          <AppInput
            v-model="form.monto"
            type="number"
            inputmode="decimal"
            placeholder="0.00"
            :state="errores.monto ? 'error' : 'default'"
          />
        </AppFormField>
      </div>

      <AppFormField label="Descripción / concepto" required :error="errores.observacion">
        <AppTextarea
          v-model="form.observacion"
          :rows="3"
          :placeholder="ejemploDescripcion"
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
        {{ mutation.isPending.value ? 'Guardando...' : ctaLabel }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppSelectSearch from '@/shared/components/form/AppSelectSearch.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useCrearCuentaMutation } from '@/modules/finanzas/composables/usePagoMutations'
import type { TipoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'
import type { ClienteListFilters } from '@/modules/clientes/interfaces/cliente.interface'
import { ICONS } from '@/shared/constants/icons'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const props = defineProps<{ tipo: TipoCuenta }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const mutation = useCrearCuentaMutation(props.tipo)

const esCobrar = computed(() => props.tipo === 'COBRAR')
const titulo = computed(() => (esCobrar.value ? 'Nueva cuenta por cobrar' : 'Nueva cuenta por pagar'))
const subtitulo = computed(() =>
  esCobrar.value
    ? 'Registra una cuenta por cobrar externa (no derivada de una venta).'
    : 'Registra una cuenta por pagar externa (no derivada de una compra).',
)
const ctaLabel = computed(() => (esCobrar.value ? 'Crear cuenta por cobrar' : 'Crear cuenta por pagar'))
const terceroLabel = computed(() => (esCobrar.value ? 'Cliente / Tercero' : 'Proveedor / Tercero'))
const ejemploDescripcion = computed(() =>
  esCobrar.value
    ? 'Ej.: Devolución de anticipo, aporte pendiente, alquiler no facturado...'
    : 'Ej.: Préstamo bancario BCP cuota 3/12, honorarios contador, alquiler local...',
)

/* ---------- Búsqueda remota de terceros ---------- */
const terceroSearch = ref('')
const clientesFilters = ref<ClienteListFilters>({
  buscar: '',
  pagina: 1,
  limite: 50,
  soloActivos: 1,
})

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(terceroSearch, (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    clientesFilters.value = { ...clientesFilters.value, buscar: value.trim(), pagina: 1 }
  }, 300)
})

const clientesQuery = useClientesQuery(clientesFilters)

const terceroOptions = computed<SelectOption[]>(() =>
  (clientesQuery.data.value?.data ?? []).map((cliente) => {
    const nombre =
      cliente.razon_social?.trim() ||
      [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
        .filter(Boolean)
        .join(' ') ||
      `Cliente #${cliente.id}`
    const doc = cliente.numero_documento ? ` · ${cliente.numero_documento}` : ''
    return { label: `${nombre}${doc}`, value: cliente.id }
  }),
)

/* ---------- Formulario ---------- */
const hoy = () => new Date().toISOString().slice(0, 10)

interface FormState {
  idTercero: number | null
  fechaEmision: string
  fechaVencimiento: string
  monto: string | number
  observacion: string
}

const form = reactive<FormState>({
  idTercero: null,
  fechaEmision: hoy(),
  fechaVencimiento: '',
  monto: '',
  observacion: '',
})

const errores = reactive<Record<string, string | undefined>>({})

const resetForm = () => {
  form.idTercero = null
  form.fechaEmision = hoy()
  form.fechaVencimiento = ''
  form.monto = ''
  form.observacion = ''
  terceroSearch.value = ''
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

const validar = (): boolean => {
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
  let ok = true

  if (!form.idTercero) {
    errores.idTercero = `Selecciona un ${terceroLabel.value.toLowerCase()}`
    ok = false
  }
  if (!form.fechaEmision) {
    errores.fechaEmision = 'La fecha de emisión es obligatoria'
    ok = false
  }
  if (form.fechaVencimiento && form.fechaEmision && form.fechaVencimiento < form.fechaEmision) {
    errores.fechaVencimiento = 'No puede ser anterior a la emisión'
    ok = false
  }
  const monto = Number(form.monto)
  if (!monto || monto <= 0) {
    errores.monto = 'Ingresa un monto mayor a cero'
    ok = false
  }
  if (!form.observacion.trim()) {
    errores.observacion = 'Describe el motivo de la cuenta'
    ok = false
  } else if (form.observacion.length > 500) {
    errores.observacion = 'Máximo 500 caracteres'
    ok = false
  }

  return ok
}

const submit = async () => {
  if (!validar()) return

  try {
    await mutation.mutateAsync({
      idTercero: form.idTercero as number,
      fechaEmision: form.fechaEmision,
      fechaVencimiento: form.fechaVencimiento || undefined,
      monto: Number(form.monto),
      observacion: form.observacion.trim(),
      idUsuarioAuditoria: authStore.user?.id ?? undefined,
    })
    open.value = false
    emit('saved')
  } catch {
    // El toast lo maneja la mutación.
  }
}
</script>
