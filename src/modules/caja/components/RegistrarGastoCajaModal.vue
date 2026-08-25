<template>
  <AppModal v-model="open" :title="isEdit ? 'Editar gasto de caja' : 'Registrar gasto de caja'" size="md">
    <div class="space-y-4">
      <AppFormField label="Concepto" required :error="errores.concepto">
        <AppInput v-model="form.concepto" placeholder="Combustible, flete, vigilancia..." />
      </AppFormField>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Monto" required :error="errorMonto">
          <MoneyInput
            v-model="form.monto"
            placeholder="0.00"
            :state="errorMonto ? 'error' : 'default'"
            @blur="onBlurMonto"
          />
        </AppFormField>
        <AppFormField label="Medio de pago" optional>
          <AppSelect v-model="form.idMedioPago" :options="medioOptions" placeholder="Efectivo / Yape..." />
        </AppFormField>
      </div>
      <AppFormField label="Categoría de gasto" optional>
        <AppSelectWithCreate
          :can-create="canCrearCategoriaGasto"
          create-title="Nueva categoría de gasto"
          :disabled="guardando"
          @create="categoriaGastoModalOpen = true"
        >
          <AppSelect
            v-model="form.idCategoriaGasto"
            :options="categoriaGastoOptions"
            placeholder="Seleccionar"
          />
        </AppSelectWithCreate>
      </AppFormField>
      <AppFormField label="Nº operación" optional>
        <AppInput v-model="form.numeroOperacion" />
      </AppFormField>
      <AppFormField label="Observación" optional>
        <AppTextarea v-model="form.observacion" :rows="2" />
      </AppFormField>
    </div>
    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="guardando"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="guardando || !formularioValido"
        @click="submit"
      >
        {{ guardando ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar gasto' }}
      </button>
    </template>
  </AppModal>

  <ListaOpcionFormModal
    v-model="categoriaGastoModalOpen"
    :id-lista="ListaIds.CATEGORIA_GASTO"
    title="Nueva categoría de gasto"
    subtitle="Quedará disponible para clasificar gastos de caja y compras."
    nombre-placeholder="Ej. ALQUILER_LOCAL"
    @saved="onCategoriaGastoCreada"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'
import { AppInput, AppModal, AppSelect, AppSelectWithCreate, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useActualizarCajaGastoMutation, useCrearCajaGastoMutation } from '@/modules/caja/composables/useCajaQuery'
import type { CajaMovimientoGasto } from '@/modules/caja/interfaces/caja.interface'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { mensajeErrorMontoMoneda, parseMoneyInput, roundMoney } from '@/shared/utils/currency'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  /** Requerida solo al crear (backend resuelve la sesión abierta de esa fecha/sucursal). */
  fecha?: string
  idSesion?: number | null
  idSucursal?: number | null
  /** Presente => modo edición del gasto indicado. */
  gasto?: CajaMovimientoGasto | null
}>()
const emit = defineEmits<{ saved: [] }>()

const isEdit = computed(() => Boolean(props.gasto))
const authStore = useAuthStore()
const form = reactive({
  concepto: '',
  monto: '',
  idMedioPago: null as number | null,
  idCategoriaGasto: null as number | null,
  numeroOperacion: '',
  observacion: '',
})
const errores = reactive({ concepto: '' })
const crearMutation = useCrearCajaGastoMutation()
const actualizarMutation = useActualizarCajaGastoMutation()
const mediosQuery = useMediosPagoQuery()
const guardando = computed(() => crearMutation.isPending.value || actualizarMutation.isPending.value)
const medioOptions = computed<SelectOption[]>(() =>
  (mediosQuery.data.value ?? []).map((m) => ({ value: m.id, label: m.nombre })),
)

const categoriaGastoQuery = useListaOpcionesQuery(computed(() => ListaIds.CATEGORIA_GASTO))
const categoriaGastoOptions = computed(() => toSelectOptions(categoriaGastoQuery.data.value))
const canCrearCategoriaGasto = computed(() =>
  authStore.hasPermission(PermisoBanderas.CAJA_REGISTRAR_GASTO),
)
const categoriaGastoModalOpen = ref(false)
function onCategoriaGastoCreada(opcion: ListaOpcion) {
  form.idCategoriaGasto = opcion.id
}

const { error: errorMonto, valido: montoValido, onBlur: onBlurMonto } = useMoneyField(
  toRef(form, 'monto'),
  { min: 0.01 },
)

const formularioValido = computed(
  () => form.concepto.trim().length > 0 && montoValido.value,
)

watch(open, (v) => {
  if (!v) return

  const g = props.gasto
  form.concepto = g?.concepto ?? ''
  form.monto = g?.monto != null ? String(g.monto) : ''
  form.idMedioPago = g?.idMedioPago ?? null
  form.idCategoriaGasto = g?.idCategoriaGasto ?? null
  form.numeroOperacion = g?.numeroOperacion ?? ''
  form.observacion = g?.observacion ?? ''
  errores.concepto = ''
})

async function submit() {
  errores.concepto = form.concepto.trim() ? '' : 'Obligatorio'
  if (mensajeErrorMontoMoneda(form.monto, { min: 0.01 })) return
  if (errores.concepto) return

  const monto = roundMoney(parseMoneyInput(form.monto))

  if (isEdit.value && props.gasto) {
    await actualizarMutation.mutateAsync({
      id: props.gasto.id,
      payload: {
        concepto: form.concepto.trim(),
        monto,
        idMedioPago: form.idMedioPago,
        idCategoriaGasto: form.idCategoriaGasto,
        numeroOperacion: form.numeroOperacion || undefined,
        observacion: form.observacion || undefined,
      },
    })
  } else {
    if (!props.fecha) return
    await crearMutation.mutateAsync({
      fecha: props.fecha,
      concepto: form.concepto.trim(),
      monto,
      idMedioPago: form.idMedioPago,
      idCategoriaGasto: form.idCategoriaGasto,
      numeroOperacion: form.numeroOperacion || undefined,
      observacion: form.observacion || undefined,
      idSesion: props.idSesion ?? undefined,
      idSucursal: props.idSucursal ?? undefined,
    })
  }
  open.value = false
  emit('saved')
}
</script>
