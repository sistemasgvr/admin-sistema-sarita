<template>
  <AppModal v-model="open" :title="titulo" :subtitle="subtitulo" size="lg">
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

      <!-- Toggle plan de cuotas -->
      <div
        class="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-white/[0.03]"
      >
        <div class="min-w-0">
          <p class="text-theme-sm font-medium text-gray-700 dark:text-gray-200">
            ¿Se pagará en cuotas?
          </p>
          <p class="text-theme-xs text-gray-500 dark:text-gray-400">
            {{ esPlan
              ? 'Se generará una cabecera + N cuotas. Los pagos se aplican a cada cuota.'
              : 'Cuenta simple: un solo saldo con un solo vencimiento.'
            }}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="esPlan"
          :class="[
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
            esPlan ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600',
          ]"
          @click="alternarPlan"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition',
              esPlan ? 'translate-x-6' : 'translate-x-1',
            ]"
          />
        </button>
      </div>

      <!-- Selector de modo tercero -->
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <label class="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            {{ terceroLabel }} <span class="text-error-500">*</span>
          </label>
        </div>

        <div
          class="mb-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
          role="tablist"
        >
          <button
            v-for="opt in modoOptions"
            :key="opt.value"
            type="button"
            role="tab"
            :aria-selected="modoTercero === opt.value"
            :class="[
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
              modoTercero === opt.value
                ? 'bg-white text-brand-600 shadow-theme-xs dark:bg-gray-900 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="cambiarModo(opt.value)"
          >
            <AppIcon :name="opt.icon" :size="14" />
            {{ opt.label }}
          </button>
        </div>

        <AppSelectSearch
          v-if="modoTercero !== 'libre'"
          v-model="form.idTercero"
          :options="terceroOptions"
          v-model:search="terceroSearch"
          :placeholder="`Selecciona un ${singularModo}`"
          search-placeholder="Buscar por nombre o documento..."
          remote
          :loading="clientesQuery.isFetching.value"
          :error="errores.idTercero"
        />

        <template v-else>
          <AppInput
            v-model="form.terceroNombre"
            type="text"
            :placeholder="placeholderNombre"
            :state="errores.terceroNombre ? 'error' : 'default'"
            maxlength="255"
          />
          <p v-if="errores.terceroNombre" class="mt-1 text-theme-xs text-error-500">
            {{ errores.terceroNombre }}
          </p>
          <p v-else class="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
            {{ ayudaNombre }}
          </p>
        </template>
      </div>

      <!-- Fechas y monto -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Fecha de emisión" required :error="errores.fechaEmision">
          <AppInput
            v-model="form.fechaEmision"
            type="date"
            :state="errores.fechaEmision ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField
          v-if="!esPlan"
          label="Fecha de vencimiento"
          optional
          :error="errores.fechaVencimiento"
        >
          <AppInput
            v-model="form.fechaVencimiento"
            type="date"
            :state="errores.fechaVencimiento ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField
          v-else
          label="Cuándo inicia la primera cuota"
          required
          :error="errores.fechaPrimeraCuota"
        >
          <AppInput
            v-model="form.fechaPrimeraCuota"
            type="date"
            :state="errores.fechaPrimeraCuota ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField
          :label="esPlan ? 'Monto total del plan' : 'Monto'"
          required
          :error="errorMontoDisplay"
          class="sm:col-span-2"
        >
          <MoneyInput
            v-model="form.monto"
            placeholder="0.00"
            :state="errorMontoDisplay ? 'error' : 'default'"
            @blur="onBlurMonto"
          />
        </AppFormField>
      </div>

      <!-- Campos del plan de cuotas (solo si esPlan) -->
      <div
        v-if="esPlan"
        class="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-white/[0.02] sm:grid-cols-2"
      >
        <AppFormField label="Número de cuotas" required :error="errores.numeroCuotas">
          <AppInput
            v-model="form.numeroCuotas"
            type="number"
            inputmode="numeric"
            :min="1"
            :step="1"
            placeholder="12"
            :state="errores.numeroCuotas ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField label="¿Qué día del mes se paga?" required :error="errores.diaMesPago">
          <AppInput
            v-model="form.diaMesPago"
            type="number"
            inputmode="numeric"
            :min="1"
            :max="31"
            :step="1"
            placeholder="30"
            :state="errores.diaMesPago ? 'error' : 'default'"
          />
          <p class="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
            Del 1 al 31. Si el mes no tiene ese día (ej. 31 en febrero), se usa el último día del mes.
          </p>
        </AppFormField>

        <AppFormField label="Banco" optional class="sm:col-span-2">
          <AppSelect
            v-model="form.idBanco"
            :options="bancoOptions"
            placeholder="Selecciona un banco (opcional)"
          />
        </AppFormField>

        <p class="text-theme-xs text-gray-500 dark:text-gray-400 sm:col-span-2">
          Se generará{{ Number(form.numeroCuotas) === 1 ? '' : 'n' }}
          <strong>{{ form.numeroCuotas || 0 }}</strong>
          {{ Number(form.numeroCuotas) === 1 ? 'cuota' : 'cuotas' }} de aprox.
          <strong>{{ formatCurrency(cuotaAproximada) }}</strong>
          {{ Number(form.numeroCuotas) === 1 ? '' : 'cada una' }}, mensualmente el
          <strong>día {{ form.diaMesPago || '—' }}</strong> de cada mes
          (la primera el <strong>{{ form.fechaPrimeraCuota || '—' }}</strong>).
        </p>
      </div>

      <AppFormField label="N° de comprobante / documento" optional :error="errores.numeroComprobante">
        <AppInput
          v-model="form.numeroComprobante"
          type="text"
          placeholder="Opcional. Ej.: F001-000123, BCP-OP-88121, etc."
          maxlength="50"
          :state="errores.numeroComprobante ? 'error' : 'default'"
        />
      </AppFormField>

      <AppFormField label="Descripción / concepto" required :error="errores.observacion">
        <AppTextarea v-model="form.observacion" :rows="3" :placeholder="ejemploDescripcion" />
      </AppFormField>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="guardando"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="guardando || !montoValido"
        @click="submit"
      >
        {{ guardando ? 'Guardando...' : ctaLabel }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'
import { AppInput, AppModal, AppSelect, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppSelectSearch from '@/shared/components/form/AppSelectSearch.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import {
  useCrearCuentaCuotasMutation,
  useCrearCuentaMutation,
} from '@/modules/finanzas/composables/usePagoMutations'
import type { TipoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'
import type { ClienteListFilters } from '@/modules/clientes/interfaces/cliente.interface'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import {
  formatCurrency,
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'
import type { SelectOption } from '@/shared/interfaces/form.interface'

type ModoTercero = 'cliente' | 'proveedor' | 'libre'

const props = defineProps<{ tipo: TipoCuenta }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const crearSimpleMutation = useCrearCuentaMutation(props.tipo)
const crearCuotasMutation = useCrearCuentaCuotasMutation(props.tipo)

const guardando = computed(
  () => crearSimpleMutation.isPending.value || crearCuotasMutation.isPending.value,
)

/* ---------- Etiquetas dinámicas ---------- */
const esCobrar = computed(() => props.tipo === 'COBRAR')
const titulo = computed(() => (esCobrar.value ? 'Nueva cuenta por cobrar' : 'Nueva cuenta por pagar'))
const subtitulo = computed(() =>
  esCobrar.value
    ? 'Registra una cuenta por cobrar externa (no derivada de una venta).'
    : 'Registra una cuenta por pagar externa (no derivada de una compra).',
)
const ctaLabel = computed(() => {
  if (esPlan.value) return esCobrar.value ? 'Crear plan de cobro' : 'Crear plan de pago'
  return esCobrar.value ? 'Crear cuenta por cobrar' : 'Crear cuenta por pagar'
})
const terceroLabel = computed(() =>
  esCobrar.value ? 'Cliente / Proveedor' : 'Proveedor / Cliente',
)
const ejemploDescripcion = computed(() =>
  esCobrar.value
    ? 'Ej.: Devolución de anticipo, aporte pendiente, alquiler no facturado...'
    : 'Ej.: Préstamo bancario BCP cuota 3/12, honorarios contador, alquiler local...',
)
const placeholderNombre = computed(() =>
  esCobrar.value
    ? 'Ej.: Juan Pérez, Constructora Los Andes, etc.'
    : 'Ej.: Banco de Crédito del Perú, Julia Ríos (arriendo), etc.',
)
const ayudaNombre = computed(() =>
  esCobrar.value
    ? 'Persona o entidad de la que vas a cobrar (aún no está registrada).'
    : 'Persona o entidad a la que le vas a pagar (aún no está registrada).',
)

/* ---------- Toggle plan de cuotas ---------- */
const esPlan = ref(false)

const alternarPlan = () => {
  esPlan.value = !esPlan.value
  // Limpiar campos del modo anterior
  form.fechaVencimiento = ''
  form.fechaPrimeraCuota = ''
  form.numeroCuotas = ''
  form.diaMesPago = ''
  form.idBanco = ''
  errores.fechaVencimiento = undefined
  errores.fechaPrimeraCuota = undefined
  errores.numeroCuotas = undefined
  errores.diaMesPago = undefined
}

/* ---------- Selector de modo tercero ---------- */
// Por defecto: cliente (CxC) o proveedor (CxP)
const modoTercero = ref<ModoTercero>(esCobrar.value ? 'cliente' : 'proveedor')

const modoOptions = computed<{ value: ModoTercero; label: string; icon: string }[]>(() => [
  { value: 'cliente', label: 'Cliente', icon: ICONS.users },
  { value: 'proveedor', label: 'Proveedor', icon: ICONS.building2 },
  { value: 'libre', label: 'Nombre libre', icon: ICONS.pencil },
])

const cambiarModo = (modo: ModoTercero) => {
  if (modoTercero.value === modo) return
  modoTercero.value = modo
  form.idTercero = null
  form.terceroNombre = ''
  terceroSearch.value = ''
  errores.idTercero = undefined
  errores.terceroNombre = undefined
}

const singularModo = computed(() =>
  modoTercero.value === 'proveedor' ? 'proveedor' : 'cliente',
)

/* ---------- Búsqueda remota de terceros ---------- */
const terceroSearch = ref('')

// Carga opciones de TipoCliente para saber el id de CLIENTE y PROVEEDOR
const tipoClienteListaId = ref(ListaIds.TIPO_CLIENTE)
const tiposClienteQuery = useListaOpcionesQuery(tipoClienteListaId)

const idTipoCliente = computed(
  () => tiposClienteQuery.data.value?.find((o) => o.nombre?.toUpperCase() === 'CLIENTE')?.id,
)
const idTipoProveedor = computed(
  () => tiposClienteQuery.data.value?.find((o) => o.nombre?.toUpperCase() === 'PROVEEDOR')?.id,
)

const idTipoActual = computed(() => {
  if (modoTercero.value === 'cliente') return idTipoCliente.value
  if (modoTercero.value === 'proveedor') return idTipoProveedor.value
  return undefined
})

const clientesFilters = ref<ClienteListFilters>({
  buscar: '',
  pagina: 1,
  limite: 50,
  soloActivos: 1,
})

// Cuando cambie el idTipoActual, re-filtra la lista
watch(idTipoActual, (tipo) => {
  clientesFilters.value = { ...clientesFilters.value, idTipoCliente: tipo, pagina: 1 }
}, { immediate: true })

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

/* ---------- Bancos (para plan de cuotas) ---------- */
const bancoListaId = ref(ListaIds.BANCO)
const bancosQuery = useListaOpcionesQuery(bancoListaId)

const bancoOptions = computed<SelectOption[]>(() => [
  { label: '— Sin banco —', value: '' },
  ...(bancosQuery.data.value ?? []).map((opt) => ({ label: opt.nombre, value: opt.id })),
])

/* ---------- Formulario ---------- */
const hoy = () => new Date().toISOString().slice(0, 10)

interface FormState {
  idTercero: number | null
  terceroNombre: string
  fechaEmision: string
  fechaVencimiento: string
  monto: string
  numeroComprobante: string
  observacion: string
  // Plan de cuotas
  fechaPrimeraCuota: string
  numeroCuotas: string | number
  diaMesPago: string | number
  idBanco: string | number
}

const form = reactive<FormState>({
  idTercero: null,
  terceroNombre: '',
  fechaEmision: hoy(),
  fechaVencimiento: '',
  monto: '',
  numeroComprobante: '',
  observacion: '',
  fechaPrimeraCuota: '',
  numeroCuotas: '',
  diaMesPago: '',
  idBanco: '',
})

const errores = reactive<Record<string, string | undefined>>({})

const moneyOpts = { min: 0.01 } as const
const { error: errorMonto, valido: montoValido, onBlur: onBlurMonto } = useMoneyField(
  toRef(form, 'monto'),
  moneyOpts,
)
const errorMontoDisplay = computed(() => errores.monto || errorMonto.value)

const resetForm = () => {
  esPlan.value = false
  modoTercero.value = esCobrar.value ? 'cliente' : 'proveedor'
  form.idTercero = null
  form.terceroNombre = ''
  form.fechaEmision = hoy()
  form.fechaVencimiento = ''
  form.monto = ''
  form.numeroComprobante = ''
  form.observacion = ''
  form.fechaPrimeraCuota = ''
  form.numeroCuotas = ''
  form.diaMesPago = ''
  form.idBanco = ''
  terceroSearch.value = ''
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

/* ---------- Cuota aproximada (info visual) ---------- */
const cuotaAproximada = computed(() => {
  const monto = parseMoneyInput(form.monto)
  const n = Number(form.numeroCuotas)
  if (monto == null || !Number.isFinite(n) || monto <= 0 || n < 1) return 0
  return Math.round((monto / n) * 100) / 100
})

/* ---------- Validación reactiva ---------- */
watch(
  () => form.idTercero,
  (v) => {
    if (v) errores.idTercero = undefined
  },
)
watch(
  () => form.terceroNombre,
  (v) => {
    const t = v.trim()
    if (t.length >= 2 && t.length <= 255) errores.terceroNombre = undefined
  },
)
watch(
  () => form.fechaEmision,
  (v) => {
    if (v) errores.fechaEmision = undefined
    if (!form.fechaVencimiento || v <= form.fechaVencimiento) {
      errores.fechaVencimiento = undefined
    }
    if (!form.fechaPrimeraCuota || v <= form.fechaPrimeraCuota) {
      errores.fechaPrimeraCuota = undefined
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
  () => form.fechaPrimeraCuota,
  (v) => {
    if (!v || !form.fechaEmision || v >= form.fechaEmision) {
      errores.fechaPrimeraCuota = undefined
    }
  },
)
watch(
  () => form.numeroCuotas,
  (v) => {
    const n = Number(v)
    if (Number.isInteger(n) && n >= 1) errores.numeroCuotas = undefined
  },
)
watch(
  () => form.diaMesPago,
  (v) => {
    const n = Number(v)
    if (Number.isInteger(n) && n >= 1 && n <= 31) errores.diaMesPago = undefined
  },
)
watch(
  () => form.numeroComprobante,
  (v) => {
    if (v.length <= 50) errores.numeroComprobante = undefined
  },
)
watch(
  () => form.observacion,
  (v) => {
    const t = v.trim()
    if (t.length > 0 && v.length <= 500) errores.observacion = undefined
  },
)

/* ---------- Validación completa ---------- */
const validar = (): boolean => {
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
  let ok = true

  // Tercero
  if (modoTercero.value !== 'libre') {
    if (!form.idTercero) {
      errores.idTercero = `Selecciona un ${singularModo.value}`
      ok = false
    }
  } else {
    const nombre = form.terceroNombre.trim()
    if (!nombre) {
      errores.terceroNombre = 'Ingresa el nombre de la persona o entidad'
      ok = false
    } else if (nombre.length < 2) {
      errores.terceroNombre = 'El nombre es demasiado corto'
      ok = false
    } else if (nombre.length > 255) {
      errores.terceroNombre = 'Máximo 255 caracteres'
      ok = false
    }
  }

  // Fecha emisión
  if (!form.fechaEmision) {
    errores.fechaEmision = 'La fecha de emisión es obligatoria'
    ok = false
  }

  // Fechas alternativas según modo
  if (!esPlan.value) {
    if (form.fechaVencimiento && form.fechaEmision && form.fechaVencimiento < form.fechaEmision) {
      errores.fechaVencimiento = 'No puede ser anterior a la emisión'
      ok = false
    }
  } else {
    if (form.fechaPrimeraCuota && form.fechaEmision && form.fechaPrimeraCuota < form.fechaEmision) {
      errores.fechaPrimeraCuota = 'No puede ser anterior a la emisión'
      ok = false
    }
  }

  const msgMonto = mensajeErrorMontoMoneda(form.monto, moneyOpts)
  if (msgMonto) {
    errores.monto = msgMonto
    ok = false
  }

  // Campos exclusivos del plan
  if (esPlan.value) {
    if (!form.fechaPrimeraCuota) {
      errores.fechaPrimeraCuota = 'La fecha de la primera cuota es obligatoria'
      ok = false
    }

    const nCuotas = Number(form.numeroCuotas)
    if (!Number.isInteger(nCuotas) || nCuotas < 1) {
      errores.numeroCuotas = 'Debe ser un entero >= 1'
      ok = false
    } else if (nCuotas > 360) {
      errores.numeroCuotas = 'Máximo 360 cuotas'
      ok = false
    }

    const dia = Number(form.diaMesPago)
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
      errores.diaMesPago = 'Ingresa un día del mes entre 1 y 31'
      ok = false
    }
  }

  // Comprobante (opcional)
  if (form.numeroComprobante.length > 50) {
    errores.numeroComprobante = 'Máximo 50 caracteres'
    ok = false
  }

  // Descripción
  if (!form.observacion.trim()) {
    errores.observacion = 'Describe el motivo de la cuenta'
    ok = false
  } else if (form.observacion.length > 500) {
    errores.observacion = 'Máximo 500 caracteres'
    ok = false
  }

  return ok
}

/* ---------- Submit ---------- */
const submit = async () => {
  if (mensajeErrorMontoMoneda(form.monto, moneyOpts)) return
  if (!validar()) return

  const esRegistrado = modoTercero.value !== 'libre'
  const montoFinal = roundMoney(parseMoneyInput(form.monto))

  const terceroBase = {
    idTercero: esRegistrado ? (form.idTercero as number) : undefined,
    terceroNombre: esRegistrado ? undefined : form.terceroNombre.trim(),
  }
  const numeroComprobante = form.numeroComprobante.trim() || undefined
  const idUsuarioAuditoria = authStore.user?.id ?? undefined

  try {
    if (!esPlan.value) {
      await crearSimpleMutation.mutateAsync({
        ...terceroBase,
        fechaEmision: form.fechaEmision,
        fechaVencimiento: form.fechaVencimiento || undefined,
        monto: montoFinal,
        numeroComprobante,
        observacion: form.observacion.trim(),
        idUsuarioAuditoria,
      })
    } else {
      await crearCuotasMutation.mutateAsync({
        ...terceroBase,
        fechaEmision: form.fechaEmision,
        montoTotal: montoFinal,
        numeroCuotas: Number(form.numeroCuotas),
        fechaPrimeraCuota: form.fechaPrimeraCuota,
        diaMesPago: Number(form.diaMesPago),
        idBanco: form.idBanco ? Number(form.idBanco) : undefined,
        numeroComprobante,
        observacion: form.observacion.trim(),
        idUsuarioAuditoria,
      })
    }
    open.value = false
    emit('saved')
  } catch {
    // Los toasts los maneja cada mutación
  }
}
</script>
