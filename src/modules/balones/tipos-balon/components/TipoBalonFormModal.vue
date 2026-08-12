<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo tipo de balón' : 'Editar tipo de balón'"
    :subtitle="
      mode === 'create'
        ? 'Define la capacidad y gas asociado a un tipo de cilindro.'
        : 'Actualiza los datos del tipo seleccionado.'
    "
    size="md"
    @close="handleClose"
  >
    <form id="tipo-balon-form" autocomplete="off" @submit="onSubmit">
      <FormCardsLayout>
        <DetailSectionCard title="Datos del tipo" :icon="ICONS.layers" :full-width="true">
          <div class="space-y-4">
            <AppInput
              v-model="nombre"
              label="Nombre"
              placeholder="Oxígeno Industrial D/E"
              required
              v-bind="nombreAttrs"
              :disabled="isSubmitting"
              :error="errors.nombre"
            />

            <ProductoSelectField
              v-model="idGas"
              v-model:search="gasBuscar"
              label="Gas (producto)"
              placeholder="Buscar y seleccionar gas..."
              search-placeholder="Código o nombre..."
              :es-gas="true"
              :options="gasSelectedOptions"
              :disabled="isSubmitting"
              :error="errors.idGas"
              help="Solo productos marcados como gas. Borra el buscador para ver el listado."
            />

            <div class="grid gap-4 sm:grid-cols-2">
              <AppInput
                v-model="capacidad"
                :label="labelCapacidad"
                type="number"
                :min="NUMBER_MIN.measure"
                step="any"
                placeholder="10"
                :help="helpCapacidad"
                v-bind="capacidadAttrs"
                :disabled="isSubmitting"
                :error="errors.capacidad"
              />

              <AppInput
                v-model="capacidadLb"
                label="Capacidad llena (lb)"
                type="number"
                :min="NUMBER_MIN.measure"
                step="any"
                placeholder="31.5"
                :help="helpCapacidadLb"
                v-bind="capacidadLbAttrs"
                :disabled="isSubmitting"
                :error="errors.capacidadLb"
              />
            </div>

            <AppSelectWithCreate
              :can-create="canCreateUnidad"
              create-title="Nueva unidad de medida"
              :disabled="isSubmitting || isLoadingUnidadMedida"
              @create="unidadModalOpen = true"
            >
              <AppSelect
                v-model="idUnidadMedida"
                label="Unidad de medida (capacidad)"
                :placeholder="isLoadingUnidadMedida ? 'Cargando...' : 'Selecciona...'"
                :options="unidadMedidaOptions"
                :disabled="isSubmitting || isLoadingUnidadMedida"
                v-bind="idUnidadMedidaAttrs"
                :error="errors.idUnidadMedida"
                :help="helpUnidadMedida"
              />
            </AppSelectWithCreate>

            <div class="grid gap-4 sm:grid-cols-2">
              <AppInput
                v-model="peso"
                label="Peso tara (kg)"
                type="number"
                :min="NUMBER_MIN.measure"
                step="any"
                placeholder="0"
                :help="helpPesoTaraKg"
                v-bind="pesoAttrs"
                :disabled="isSubmitting"
                :error="errors.peso"
              />
              <AppInput
                v-model="pesoTaraLb"
                label="Peso tara (lb)"
                type="number"
                :min="NUMBER_MIN.measure"
                step="any"
                placeholder="0"
                help="Misma tara en libras (kg × 2.20462). Bruto − tara = gas neto en báscula."
                v-bind="pesoTaraLbAttrs"
                :disabled="isSubmitting"
                :error="errors.pesoTaraLb"
              />
            </div>

            <p
              v-if="taraReferencia"
              class="rounded-lg border px-3 py-2 text-xs leading-relaxed"
              :class="
                taraFueraDeRango
                  ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400'
              "
            >
              <span class="font-medium">Referencia {{ taraReferencia.label }}:</span>
              tara típica {{ taraReferencia.minKg }}–{{ taraReferencia.maxKg }} kg
              ({{ taraReferencia.capacidadHint }}).
              <template v-if="taraFueraDeRango">
                El valor ingresado está fuera del rango usual; puedes guardarlo si es correcto
                (material distinto, modelo especial, etc.).
              </template>
            </p>

            <AppInput
              v-model="presionLlenadoPsi"
              label="Presión de llenado (PSI)"
              type="number"
              :min="NUMBER_MIN.measure"
              step="any"
              placeholder="2000"
              help="PSI a capacidad nominal. Se usa para estimar m³ desde presión."
              v-bind="presionLlenadoPsiAttrs"
              :disabled="isSubmitting"
              :error="errors.presionLlenadoPsi"
            />

            <AppSelectWithCreate
              can-create
              create-title="Agregar vigencia P.H."
              :disabled="isSubmitting"
              @create="vigenciaModalOpen = true"
            >
              <AppSelect
                v-model="vigenciaPhAnios"
                label="Vigencia P.H. (años)"
                placeholder="Selecciona..."
                :options="vigenciaPhOptions"
                :disabled="isSubmitting"
                v-bind="vigenciaPhAniosAttrs"
                :error="errors.vigenciaPhAnios"
                help="Plazo de renovación de prueba hidrostática según normativa del tipo de gas."
              />
            </AppSelectWithCreate>
          </div>
        </DetailSectionCard>
      </FormCardsLayout>
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="tipo-balon-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear tipo' : 'Guardar cambios'
        }}
      </button>
    </template>
  </AppModal>

  <ListaOpcionFormModal
    v-model="unidadModalOpen"
    :id-lista="ListaIds.UNIDAD_MEDIDA"
    title="Nueva unidad de medida"
    subtitle="Quedará disponible en tipos de balón y productos."
    nombre-placeholder="Ej. m³, L, kg"
    @saved="onUnidadCreated"
  />

  <AppModal
    v-model="vigenciaModalOpen"
    title="Agregar vigencia P.H."
    subtitle="Indica los años de renovación de la prueba hidrostática."
    size="sm"
    :z-index="100050"
  >
    <form id="vigencia-ph-form" autocomplete="off" @submit.prevent="addVigenciaCustom">
      <AppInput
        v-model="nuevaVigenciaAnios"
        label="Años"
        type="number"
        :min="1"
        :max="50"
        :step="1"
        placeholder="Ej. 3, 7, 15"
        required
        :error="vigenciaCustomError"
      />
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        @click="vigenciaModalOpen = false"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="vigencia-ph-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
      >
        Agregar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import {
  useCreateTipoBalonMutation,
  useUpdateTipoBalonMutation,
} from '@/modules/balones/tipos-balon/composables/useTipoBalonMutations'
import type {
  TipoBalon,
  TipoBalonFormMode,
} from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'
import {
  capacidadFromLb,
  canonicalToCapacidad,
  capacidadToCanonical,
  factoresDesdeProducto,
  kgToLb,
  labelCapacidadPorUnidad,
  lbFromCapacidad,
  lbToKg,
  roundMeasure,
  toNumberOrNull,
  unidadSoportaConversionDual,
} from '@/modules/balones/tipos-balon/utils/tipoBalonConversion'
import {
  taraDentroDeReferencia,
  taraReferenciaPorCapacidadM3,
  textoTaraReferencia,
} from '@/modules/balones/tipos-balon/utils/taraReferencia'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import { useProductoDetailQuery } from '@/modules/productos/articulos/composables/useProductoDetailQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppSelectWithCreate } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { NUMBER_MIN } from '@/shared/constants/number-input'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalNumber, requiredString } from '@/shared/validation'

interface TipoBalonFormModalProps {
  mode: TipoBalonFormMode
  tipoBalon?: TipoBalon | null
}

const props = defineProps<TipoBalonFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [tipo: TipoBalon]
}>()

const authStore = useAuthStore()
const createMutation = useCreateTipoBalonMutation()
const updateMutation = useUpdateTipoBalonMutation()

const gasBuscar = ref('')
const unidadModalOpen = ref(false)
const vigenciaModalOpen = ref(false)
const nuevaVigenciaAnios = ref<number | string>('')
const vigenciaCustomError = ref('')
const extraVigenciaOptions = ref<SelectOption[]>([])
/** Evita bucles al sincronizar campos duales. */
const syncing = ref(false)
const suppressCapacidadWatch = ref(false)

const listaUnidadMedidaId = ref(ListaIds.UNIDAD_MEDIDA)
const unidadMedidaQuery = useListaOpcionesQuery(listaUnidadMedidaId)
const isLoadingUnidadMedida = computed(() => unidadMedidaQuery.isLoading.value)
const canCreateUnidad = computed(() => Boolean(authStore.user?.id))

const unidadMedidaOptions = computed(() => toSelectOptions(unidadMedidaQuery.data.value))

const idUnidadMedidaMt3 = computed(
  () =>
    unidadMedidaQuery.data.value?.find((item) => {
      const n = (item.nombre ?? '').toUpperCase()
      return n === 'MT3' || n === 'M3'
    })?.id ?? null,
)

const gasSelectedOptions = computed(() => {
  const id = props.tipoBalon?.id_gas
  const nombre = props.tipoBalon?.nombre_gas
  if (id == null || !nombre) return []
  return [{ value: id, label: nombre }]
})

const baseVigenciaPhOptions: SelectOption[] = [
  { label: '5 años', value: 5 },
  { label: '10 años', value: 10 },
]

const vigenciaPhOptions = computed(() => {
  const map = new Map<number, SelectOption>()
  for (const option of [...baseVigenciaPhOptions, ...extraVigenciaOptions.value]) {
    map.set(Number(option.value), option)
  }
  const current = Number(vigenciaPhAnios.value)
  if (Number.isFinite(current) && current > 0 && !map.has(current)) {
    map.set(current, { label: `${current} años`, value: current })
  }
  return [...map.values()].sort((a, b) => Number(a.value) - Number(b.value))
})

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      nombre: requiredString('El nombre'),
      idGas: optionalNumber(),
      capacidad: optionalNumber(),
      capacidadLb: optionalNumber(),
      idUnidadMedida: optionalNumber(),
      peso: optionalNumber(),
      pesoTaraLb: optionalNumber(),
      presionLlenadoPsi: optionalNumber(),
      vigenciaPhAnios: optionalNumber(),
    }),
  ),
  initialValues: {
    nombre: '',
    idGas: undefined as number | undefined,
    capacidad: undefined as number | undefined,
    capacidadLb: undefined as number | undefined,
    idUnidadMedida: undefined as number | undefined,
    peso: undefined as number | undefined,
    pesoTaraLb: undefined as number | undefined,
    presionLlenadoPsi: undefined as number | undefined,
    vigenciaPhAnios: 5 as number | undefined,
  },
})

const [nombre, nombreAttrs] = defineField('nombre')
const [idGas] = defineField('idGas')
const [capacidad, capacidadAttrs] = defineField('capacidad')
const [capacidadLb, capacidadLbAttrs] = defineField('capacidadLb')
const [idUnidadMedida, idUnidadMedidaAttrs] = defineField('idUnidadMedida')
const [peso, pesoAttrs] = defineField('peso')
const [pesoTaraLb, pesoTaraLbAttrs] = defineField('pesoTaraLb')
const [presionLlenadoPsi, presionLlenadoPsiAttrs] = defineField('presionLlenadoPsi')
const [vigenciaPhAnios, vigenciaPhAniosAttrs] = defineField('vigenciaPhAnios')

const idGasRef = computed(() => {
  const id = Number(idGas.value)
  return Number.isFinite(id) && id > 0 ? id : undefined
})
const gasQuery = useProductoDetailQuery(idGasRef, open)
const factoresGas = computed(() => factoresDesdeProducto(gasQuery.data.value))

const nombreUnidadActual = computed(() => {
  const id = Number(idUnidadMedida.value)
  if (!Number.isFinite(id)) return null
  return unidadMedidaQuery.data.value?.find((item) => item.id === id)?.nombre ?? null
})

const labelCapacidad = computed(() => labelCapacidadPorUnidad(nombreUnidadActual.value))

const helpCapacidad = computed(() => {
  if (!unidadSoportaConversionDual(nombreUnidadActual.value)) {
    return 'Usa MT3, L, kg o lb para sincronizar automáticamente con capacidad en lb.'
  }
  return 'Al cambiar este valor se actualiza la capacidad llena (lb) con el factor del gas.'
})

const helpCapacidadLb = computed(() => {
  if (!unidadSoportaConversionDual(nombreUnidadActual.value)) {
    return 'Peso del gas a cilindro lleno (ruta pueblos).'
  }
  return 'Al cambiar lb se actualiza la capacidad según la unidad elegida (factor del gas).'
})

const helpUnidadMedida = computed(() => {
  if (!unidadSoportaConversionDual(nombreUnidadActual.value)) {
    return 'Para conversión dual usa MT3, L, kg o lb. Otras unidades no se sincronizan con lb.'
  }
  return 'Cambia la unidad y la capacidad se recalcula; lb se mantiene coherente con el gas.'
})

/** Capacidad actual expresada en m³ (para banda de tara de referencia). */
const capacidadM3Actual = computed(() => {
  const cap = toNumberOrNull(capacidad.value)
  const lb = toNumberOrNull(capacidadLb.value)
  if (cap != null && unidadSoportaConversionDual(nombreUnidadActual.value)) {
    const canonical = capacidadToCanonical(cap, nombreUnidadActual.value, factoresGas.value)
    if (canonical) return canonical.m3
  }
  if (lb != null) return lb * factoresGas.value.factorM3PorLb
  return null
})

const taraReferencia = computed(() => taraReferenciaPorCapacidadM3(capacidadM3Actual.value))

const taraFueraDeRango = computed(() => {
  const dentro = taraDentroDeReferencia(toNumberOrNull(peso.value), taraReferencia.value)
  return dentro === false
})

const helpPesoTaraKg = computed(() => {
  const base =
    'Peso del cilindro vacío (envase). No se calcula desde la capacidad; se sincroniza con lb.'
  if (!taraReferencia.value) return base
  return `${base} ${textoTaraReferencia(taraReferencia.value)}`
})

async function withSync(fn: () => void) {
  if (syncing.value) return
  syncing.value = true
  try {
    fn()
    await nextTick()
  } finally {
    syncing.value = false
  }
}

const syncFormValues = () => {
  gasBuscar.value = ''
  extraVigenciaOptions.value = []
  vigenciaCustomError.value = ''
  nuevaVigenciaAnios.value = ''
  suppressCapacidadWatch.value = true

  const pesoKg = toNumberOrNull(props.tipoBalon?.peso)
  const pesoLb = toNumberOrNull(props.tipoBalon?.peso_tara_lb)
  const cap = toNumberOrNull(props.tipoBalon?.capacidad)
  const capLb = toNumberOrNull(props.tipoBalon?.capacidad_lb)

  resetForm({
    values: {
      nombre: props.tipoBalon?.nombre ?? '',
      idGas: props.tipoBalon?.id_gas ?? undefined,
      capacidad: cap == null ? undefined : roundMeasure(cap),
      capacidadLb: capLb == null ? undefined : roundMeasure(capLb),
      idUnidadMedida:
        props.tipoBalon?.id_unidad_medida ?? idUnidadMedidaMt3.value ?? undefined,
      // Tara: si solo hay kg, deriva lb (2 decimales); no depende de la capacidad de gas.
      peso: pesoKg == null ? undefined : roundMeasure(pesoKg),
      pesoTaraLb:
        pesoLb != null
          ? roundMeasure(pesoLb)
          : pesoKg != null
            ? kgToLb(pesoKg)
            : undefined,
      presionLlenadoPsi: props.tipoBalon?.presion_llenado_psi ?? undefined,
      vigenciaPhAnios: props.tipoBalon?.vigencia_ph_anios ?? 5,
    },
  })
  void nextTick(() => {
    suppressCapacidadWatch.value = false
  })
}

const handleClose = () => {
  open.value = false
}

const onUnidadCreated = (opcion: ListaOpcion) => {
  idUnidadMedida.value = opcion.id
}

const addVigenciaCustom = () => {
  const anios = Number(nuevaVigenciaAnios.value)
  if (!Number.isInteger(anios) || anios < 1 || anios > 50) {
    vigenciaCustomError.value = 'Ingresa un número entero entre 1 y 50'
    return
  }

  vigenciaCustomError.value = ''
  if (!extraVigenciaOptions.value.some((item) => Number(item.value) === anios)) {
    extraVigenciaOptions.value = [
      ...extraVigenciaOptions.value,
      { label: `${anios} años`, value: anios },
    ]
  }
  vigenciaPhAnios.value = anios
  vigenciaModalOpen.value = false
  nuevaVigenciaAnios.value = ''
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const payload = {
    idUsuarioAuditoria: currentUserId,
    nombre: values.nombre,
    idGas: values.idGas,
    capacidad: values.capacidad,
    capacidadLb: values.capacidadLb,
    idUnidadMedida: values.idUnidadMedida,
    peso: values.peso,
    pesoTaraLb: values.pesoTaraLb,
    presionLlenadoPsi: values.presionLlenadoPsi,
    vigenciaPhAnios: values.vigenciaPhAnios,
  }

  try {
    let tipoGuardado: TipoBalon

    if (props.mode === 'create') {
      tipoGuardado = await createMutation.mutateAsync(payload)
    } else if (props.tipoBalon) {
      tipoGuardado = await updateMutation.mutateAsync({
        id: props.tipoBalon.id,
        payload,
      })
    } else {
      return
    }

    emit('saved', tipoGuardado)
    open.value = false
  } catch {
    // toast en mutation
  }
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      syncFormValues()
    }
  },
)

watch(
  () => props.tipoBalon,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(vigenciaModalOpen, (isOpen) => {
  if (isOpen) {
    nuevaVigenciaAnios.value = ''
    vigenciaCustomError.value = ''
  }
})

watch(capacidad, (value) => {
  if (!open.value || syncing.value || suppressCapacidadWatch.value) return
  const n = toNumberOrNull(value)
  if (n == null) return
  if (!unidadSoportaConversionDual(nombreUnidadActual.value)) return
  const lb = lbFromCapacidad(n, nombreUnidadActual.value, factoresGas.value)
  if (lb == null) return
  void withSync(() => {
    capacidadLb.value = lb
  })
})

watch(capacidadLb, (value) => {
  if (!open.value || syncing.value || suppressCapacidadWatch.value) return
  const n = toNumberOrNull(value)
  if (n == null) return
  if (!unidadSoportaConversionDual(nombreUnidadActual.value)) return
  const cap = capacidadFromLb(n, nombreUnidadActual.value, factoresGas.value)
  if (cap == null) return
  void withSync(() => {
    capacidad.value = cap
  })
})

watch(peso, (value) => {
  if (!open.value || syncing.value || suppressCapacidadWatch.value) return
  const n = toNumberOrNull(value)
  if (n == null) return
  void withSync(() => {
    pesoTaraLb.value = kgToLb(n)
  })
})

watch(pesoTaraLb, (value) => {
  if (!open.value || syncing.value || suppressCapacidadWatch.value) return
  const n = toNumberOrNull(value)
  if (n == null) return
  void withSync(() => {
    peso.value = lbToKg(n)
  })
})

watch(idUnidadMedida, (nextId, prevId) => {
  if (!open.value || syncing.value || suppressCapacidadWatch.value) return
  if (nextId == null || prevId == null || Number(nextId) === Number(prevId)) return

  const prevNombre =
    unidadMedidaQuery.data.value?.find((item) => item.id === Number(prevId))?.nombre ?? null
  const nextNombre =
    unidadMedidaQuery.data.value?.find((item) => item.id === Number(nextId))?.nombre ?? null

  if (!unidadSoportaConversionDual(prevNombre) || !unidadSoportaConversionDual(nextNombre)) {
    return
  }

  const factores = factoresGas.value
  const cap = toNumberOrNull(capacidad.value)
  const lb = toNumberOrNull(capacidadLb.value)

  let canonical =
    cap != null ? capacidadToCanonical(cap, prevNombre, factores) : null
  if (!canonical && lb != null) {
    canonical = { m3: lb * factores.factorM3PorLb, lb }
  }
  if (!canonical) return

  const nuevaCap = canonicalToCapacidad(canonical, nextNombre, factores)
  if (nuevaCap == null) return

  void withSync(() => {
    capacidad.value = roundMeasure(nuevaCap)
    capacidadLb.value = roundMeasure(canonical!.lb)
  })
})

watch(
  () => [idGas.value, gasQuery.data.value?.factor_lb_m3, gasQuery.data.value?.factor_kg_m3] as const,
  () => {
    if (!open.value || syncing.value || suppressCapacidadWatch.value) return
    if (!unidadSoportaConversionDual(nombreUnidadActual.value)) return
    const cap = toNumberOrNull(capacidad.value)
    if (cap == null) return
    const lb = lbFromCapacidad(cap, nombreUnidadActual.value, factoresGas.value)
    if (lb == null) return
    void withSync(() => {
      capacidadLb.value = lb
    })
  },
)

watch(idUnidadMedidaMt3, (id) => {
  if (!open.value || props.mode !== 'create') return
  if (idUnidadMedida.value != null) return
  if (id != null) idUnidadMedida.value = id
})
</script>
